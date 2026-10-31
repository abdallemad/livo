import "server-only"
import type { DisputeResolution, DisputeStatus, Prisma } from "@prisma/client"
import { API_ROUTES } from "@/constants/api-routes"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { disputeRepository as repo, type AdminDisputeRow } from "@/repositories/dispute.repository"
import { ledgerRepository } from "@/repositories/ledger.repository"
import type { DisputeListQuery, ResolveDisputeFormValues } from "@/schemas/admin.schema"
import { getEntityHistory } from "@/services/audit.service"
import type { AdminDisputeDetail, AdminDisputeList, AdminDisputeListItem, DisputeStatusDto } from "@/types/admin"
import { availableResolutions, planDisputeSettlement, SettlementError, type SettlementPayment } from "@/utils/dispute-settlement"

/**
 * AD-05 dispute handling (docs/admin-disputes-reviews-feature.md): the queue,
 * one dispute with evidence and chat, OPEN → UNDER_REVIEW, and resolving it.
 * Resolving moves money through `utils/dispute-settlement.ts` and writes
 * payments, the provider wallet ledger, the booking's final status, the audit
 * entry and both parties' notifications in ONE transaction. Callers must
 * already have passed `requireAdmin()` or the admin layout gate.
 *
 * No payment gateway is wired yet: a refund is recorded on the payment row;
 * sending it to the gateway is a follow-up (CLAUDE.md §8 webhook pattern).
 */

const num = (value: { toString(): string }) => Number(value.toString())

const toSettlementPayments = (payments: { id: string; amount: unknown; refundedAmount: unknown; status: SettlementPayment["status"]; escrowState: SettlementPayment["escrowState"] }[]) =>
  payments.map((p) => ({
    id: p.id,
    amount: num(p.amount as { toString(): string }),
    refundedAmount: num(p.refundedAmount as { toString(): string }),
    status: p.status,
    escrowState: p.escrowState,
  }))

const heldOf = (payments: SettlementPayment[]) =>
  payments
    .filter((p) => p.escrowState === "HELD" && (p.status === "PAID" || p.status === "PARTIALLY_REFUNDED"))
    .reduce((s, p) => s + p.amount - p.refundedAmount, 0)

const toListItem = (d: AdminDisputeRow): AdminDisputeListItem => ({
  id: d.id,
  bookingId: d.booking.id,
  bookingNumber: d.booking.number,
  reason: d.reason,
  status: d.status,
  resolution: d.resolution,
  openedBySide: d.openedById === d.booking.customerId ? "CUSTOMER" : d.openedById === d.booking.providerId ? "PROVIDER" : "OTHER",
  openedByName: d.openedBy.name || "Unknown user",
  customerId: d.booking.customerId,
  customerName: d.booking.customer.name || "Unnamed customer",
  providerId: d.booking.providerId,
  providerName: d.booking.provider.user.name || "Unnamed provider",
  amount: num(d.booking.amount),
  held: heldOf(toSettlementPayments(d.booking.payments)),
  evidenceCount: d._count.evidence,
  createdAt: d.createdAt.toISOString(),
  resolvedAt: d.resolvedAt?.toISOString() ?? null,
})

export async function listDisputesForAdmin(query: DisputeListQuery): Promise<AdminDisputeList> {
  const where: Prisma.DisputeWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { booking: { number: { contains: query.q, mode: "insensitive" } } },
            { booking: { customer: { name: { contains: query.q, mode: "insensitive" } } } },
            { booking: { provider: { user: { name: { contains: query.q, mode: "insensitive" } } } } },
            { reason: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  }
  // Unresolved queues are first-come first-served; resolved ones show the latest decision first.
  const orderBy: Prisma.DisputeOrderByWithRelationInput = query.status === "RESOLVED" ? { resolvedAt: "desc" } : { createdAt: "asc" }
  const [[rows, total], grouped] = await Promise.all([
    repo.findAdminPage(where, orderBy, (query.page - 1) * query.perPage, query.perPage),
    repo.countByStatus(),
  ])
  const counts: Record<DisputeStatus, number> = { OPEN: 0, UNDER_REVIEW: 0, RESOLVED: 0 }
  for (const g of grouped) counts[g.status] = g._count._all

  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts,
  }
}

export async function getDisputeForAdmin(id: string): Promise<AdminDisputeDetail | null> {
  const [d, history] = await Promise.all([repo.findAdminDetail(id), getEntityHistory("Dispute", id)])
  if (!d) return null
  const b = d.booking
  const payments = toSettlementPayments(b.payments)
  const walletCreditedSoFar = await ledgerRepository.sumBookingEarnings(b.id)

  return {
    ...toListItem(d),
    resolutionNote: d.resolutionNote,
    refundAmount: d.refundAmount === null ? null : num(d.refundAmount),
    resolvedBy: d.resolvedBy?.name ?? null,
    booking: {
      status: b.status,
      source: b.source,
      title: b.service?.title ?? b.request?.title ?? "—",
      commissionRate: num(b.commissionRate),
      scheduledAt: b.scheduledAt?.toISOString() ?? null,
      completedAt: b.completedAt?.toISOString() ?? null,
    },
    payments: payments.map((p, i) => ({ ...p, method: b.payments[i]!.method, milestone: b.payments[i]!.milestone?.title ?? null })),
    walletCreditedSoFar,
    availableResolutions: d.status === "RESOLVED" ? [] : availableResolutions(payments),
    evidence: d.evidence.map((f) => ({
      id: f.id,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      createdAt: f.createdAt.toISOString(),
      url: API_ROUTES.admin.file(f.id),
    })),
    messages: b.messages.map((m) => ({
      id: m.id,
      senderSide: m.senderId === b.customerId ? "CUSTOMER" : m.senderId === b.providerId ? "PROVIDER" : "OTHER",
      senderName: m.sender.name || "Unknown user",
      body: m.body,
      contactBlocked: m.contactBlocked,
      createdAt: m.createdAt.toISOString(),
    })),
    history,
  }
}

/** OPEN → UNDER_REVIEW ("I'm on it"), audited, the person who opened it is told. */
export async function startDisputeReview(adminId: string, disputeId: string): Promise<DisputeStatusDto> {
  return repo.transaction(async (tx) => {
    const dispute = await repo.findById(disputeId, tx)
    if (!dispute) throw new NotFoundError("That dispute no longer exists.")
    if ((await repo.setStatus(disputeId, "OPEN", "UNDER_REVIEW", tx)) === 0) {
      throw new ConflictError("This dispute is already being reviewed or has been resolved.")
    }

    await auditRepository.createAuditLog(
      { actorId: adminId, action: "dispute.start_review", entityType: "Dispute", entityId: disputeId },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: dispute.openedById,
        type: "DISPUTE_UPDATE",
        title: `We're reviewing your dispute on booking ${dispute.booking.number}`,
        body: "Our team will contact both sides and post the outcome here.",
        payload: { disputeId, bookingId: dispute.booking.id },
      },
      tx,
    )

    return { id: disputeId, status: "UNDER_REVIEW" }
  })
}

const OUTCOME: Record<DisputeResolution, string> = {
  RELEASE_TO_PROVIDER: "The held payment was released to the provider.",
  PARTIAL_REFUND: "Part of the payment is refunded to the customer.",
  FULL_REFUND: "The full payment is refunded to the customer.",
  NO_ACTION: "No money was moved.",
}

/**
 * Settle a dispute (AD-05). Re-reads everything inside the transaction, plans
 * the money with the pure settlement rule, then: dispute → RESOLVED (conditional,
 * so it can't be settled twice), payments updated, one wallet ledger row for the
 * provider, a DISPUTED booking → CLOSED (or CANCELLED on a full refund), the
 * provider's completed-jobs counter refreshed, audit + notifications.
 */
export async function resolveDispute(adminId: string, disputeId: string, input: ResolveDisputeFormValues): Promise<DisputeStatusDto> {
  return repo.transaction(async (tx) => {
    const dispute = await repo.findForResolve(disputeId, tx)
    if (!dispute) throw new NotFoundError("That dispute no longer exists.")
    if (dispute.status === "RESOLVED") throw new ConflictError("This dispute has already been resolved.")
    const b = dispute.booking

    let plan
    try {
      plan = planDisputeSettlement({
        resolution: input.resolution,
        refundAmount: input.refundAmount ?? null,
        commissionRate: num(b.commissionRate),
        payments: toSettlementPayments(b.payments),
        walletCreditedSoFar: await ledgerRepository.sumBookingEarnings(b.id, tx),
      })
    } catch (error) {
      if (error instanceof SettlementError) throw new ValidationError(error.message, { [error.field ?? "resolution"]: [error.message] })
      throw error
    }

    const now = new Date()
    if (
      (await repo.resolve(
        disputeId,
        { resolution: input.resolution, refundAmount: plan.refundNow > 0 ? plan.refundNow : null, note: input.note, by: adminId, at: now },
        tx,
      )) === 0
    ) {
      throw new ConflictError("This dispute has already been resolved.")
    }

    for (const change of plan.payments) {
      await ledgerRepository.updatePayment(
        change.id,
        { refundedAmount: change.refundedAmount, status: change.status, escrowState: change.escrowState, ...(change.release ? { releasedAt: now } : {}) },
        tx,
      )
    }
    if (plan.walletDelta !== 0) {
      await ledgerRepository.createWalletEntry(
        {
          providerId: b.providerId,
          bookingId: b.id,
          type: plan.walletDelta > 0 ? "EARNING" : "REFUND_CLAWBACK",
          amount: plan.walletDelta,
          note: `Dispute decision on ${b.number}`,
        },
        tx,
      )
    }
    if (await ledgerRepository.closeDisputedBooking(b.id, input.resolution === "FULL_REFUND" ? "CANCELLED" : "CLOSED", tx)) {
      await ledgerRepository.refreshCompletedCount(b.providerId, tx)
    }

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: "dispute.resolve",
        entityType: "Dispute",
        entityId: disputeId,
        metadata: {
          resolution: input.resolution,
          refundAmount: plan.refundNow,
          walletDelta: plan.walletDelta,
          providerNetAfter: plan.providerNetAfter,
          reason: input.note,
        },
      },
      tx,
    )
    for (const userId of [b.customerId, b.providerId]) {
      await auditRepository.createNotification(
        {
          userId,
          type: "DISPUTE_UPDATE",
          title: `The dispute on booking ${b.number} is resolved`,
          body: `${OUTCOME[input.resolution]} ${input.note}`,
          payload: { disputeId, bookingId: b.id, resolution: input.resolution },
        },
        tx,
      )
    }
    return { id: disputeId, status: "RESOLVED" }
  })
}
