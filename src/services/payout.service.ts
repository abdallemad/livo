import "server-only"
import type { PayoutStatus, Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { payoutRepository as repo, type AdminPayoutRow } from "@/repositories/payout.repository"
import type { PayoutListQuery, PayoutStatusValues } from "@/schemas/admin.schema"
import type { AdminPayoutList, AdminPayoutListItem, AdminPayoutWallet, PayoutStatusDto } from "@/types/admin"
import { formatPrice } from "@/utils/format"
import { availableForPayout, PAYOUT_TRANSITIONS, payoutBlockedReason, type PayoutAction } from "@/utils/payout-rules"

/**
 * Payout requests for admins (AD-07, PR-12, docs/admin-commission-payouts-feature.md): the
 * queue with each provider's wallet, and the decisions approve / reject / mark paid. The
 * rules (which status each needs, the balance check) are `utils/payout-rules.ts`; marking paid
 * writes the `PAYOUT` ledger row (PR-11). Each decision is one transaction holding a row lock
 * on the provider, so two admins can't spend the same balance. No gateway transfer is made
 * here: the admin sends the money (bank / wallet) and records it.
 * Callers must already have passed `requireAdmin()`.
 */

const num = (value: { toString(): string } | null | undefined) => (value == null ? 0 : Number(value.toString()))
const cents = (n: number) => Math.round(n * 100) / 100
const STATUSES: PayoutStatus[] = ["REQUESTED", "APPROVED", "PAID", "REJECTED"]
const OPEN: PayoutStatus[] = ["REQUESTED", "APPROVED"]

const ACTION_BY_STATUS: Record<PayoutStatusValues["status"], PayoutAction> = { APPROVED: "APPROVE", REJECTED: "REJECT", PAID: "MARK_PAID" }

/** Balance and other approved payouts for each provider in `providerIds`. */
async function walletsFor(providerIds: string[], client?: Prisma.TransactionClient) {
  const [balances, approved] = await Promise.all([repo.walletBalances(providerIds, client), repo.approvedPayouts(providerIds, client)])
  const balance = new Map(balances.map((b) => [b.providerId, num(b._sum.amount)]))
  return (providerId: string, excludePayoutId: string): AdminPayoutWallet => {
    const reservedByOthers = cents(
      approved.filter((p) => p.providerId === providerId && p.id !== excludePayoutId).reduce((s, p) => s + num(p.amount), 0),
    )
    const b = cents(balance.get(providerId) ?? 0)
    return { balance: b, reservedByOthers, available: availableForPayout(b, reservedByOthers) }
  }
}

export async function listPayoutsForAdmin(query: PayoutListQuery): Promise<AdminPayoutList> {
  const where: Prisma.PayoutWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { id: query.q },
            { destinationRef: { contains: query.q, mode: "insensitive" } },
            { provider: { user: { name: { contains: query.q, mode: "insensitive" } } } },
            { provider: { user: { phone: { contains: query.q } } } },
          ],
        }
      : {}),
  }
  // Open queues are first come, first served; everything else shows the latest first.
  const queue = query.status === "REQUESTED" || query.status === "APPROVED"
  const orderBy: Prisma.PayoutOrderByWithRelationInput[] = [{ createdAt: queue ? "asc" : "desc" }, { id: "asc" }]

  const [[rows, total], grouped] = await Promise.all([
    repo.findAdminPage(where, orderBy, (query.page - 1) * query.perPage, query.perPage),
    repo.sumByStatus(),
  ])
  const open = rows.filter((r) => OPEN.includes(r.status))
  const [wallet, processors] = await Promise.all([
    walletsFor([...new Set(open.map((r) => r.providerId))]),
    repo.findUserNames([...new Set(rows.map((r) => r.processedById).filter((v): v is string => !!v))]),
  ])
  const processorName = new Map(processors.map((u) => [u.id, u.name || "Unknown admin"]))

  const toItem = (p: AdminPayoutRow): AdminPayoutListItem => {
    const amount = num(p.amount)
    const w = OPEN.includes(p.status) ? wallet(p.providerId, p.id) : null
    const available = w?.available ?? 0
    return {
      id: p.id,
      amount,
      status: p.status,
      destinationType: p.destinationType,
      destinationRef: p.destinationRef,
      providerId: p.providerId,
      providerName: p.provider.user.name || "Unnamed provider",
      providerPhone: p.provider.user.phone,
      rejectionReason: p.rejectionReason,
      processedBy: p.processedById ? (processorName.get(p.processedById) ?? "Unknown admin") : null,
      processedAt: p.processedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      wallet: w,
      approveBlockedReason: payoutBlockedReason("APPROVE", { status: p.status, amount }, available),
      markPaidBlockedReason: payoutBlockedReason("MARK_PAID", { status: p.status, amount }, available),
      canReject: payoutBlockedReason("REJECT", { status: p.status, amount }, available) === null,
    }
  }

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<PayoutStatus, number>
  const amounts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<PayoutStatus, number>
  for (const g of grouped) {
    counts[g.status] = g._count._all
    amounts[g.status] = num(g._sum.amount)
  }

  return {
    items: rows.map(toItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts,
    amounts,
  }
}

const NOTIFICATION: Record<PayoutAction, (amount: string) => string> = {
  APPROVE: (a) => `Your payout of ${a} is approved`,
  REJECT: (a) => `Your payout request of ${a} was not approved`,
  MARK_PAID: (a) => `Your payout of ${a} was sent`,
}

export async function decidePayout(adminId: string, id: string, input: PayoutStatusValues): Promise<PayoutStatusDto> {
  const action = ACTION_BY_STATUS[input.status]
  const transition = PAYOUT_TRANSITIONS[action]

  return repo.transaction(async (tx) => {
    const payout = await repo.findForDecision(id, tx)
    if (!payout) throw new NotFoundError("That payout request no longer exists.")
    await repo.lockProvider(payout.providerId, tx)

    const amount = num(payout.amount)
    const wallet = (await walletsFor([payout.providerId], tx))(payout.providerId, payout.id)
    const blocked = payoutBlockedReason(action, { status: payout.status, amount }, wallet.available)
    if (blocked) throw new ConflictError(blocked)

    const now = new Date()
    const reason = input.status === "REJECTED" ? input.reason : undefined
    const reference = input.status === "PAID" ? input.reference : undefined
    const changed = await repo.transition(
      id,
      transition.from,
      { status: transition.to, processedById: adminId, processedAt: now, ...(reason ? { rejectionReason: reason } : {}) },
      tx,
    )
    if (changed === 0) throw new ConflictError("This payout's status just changed. Reload to see the latest.")

    if (action === "MARK_PAID") {
      await repo.createPayoutLedgerRow(
        { providerId: payout.providerId, payoutId: id, amount, note: reference ? `Payout sent — ref ${reference}` : "Payout sent" },
        tx,
      )
    }

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: transition.audit,
        entityType: "Payout",
        entityId: id,
        metadata: { from: payout.status, amount, balanceBefore: wallet.balance, ...(reason ? { reason } : {}), ...(reference ? { reference } : {}) },
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: payout.providerId,
        type: "PAYOUT_UPDATE",
        title: NOTIFICATION[action](formatPrice(amount)),
        body: reason ?? (action === "MARK_PAID" ? `Sent to ${payout.destinationRef}.` : null),
        payload: { payoutId: id },
      },
      tx,
    )
    return { id, status: transition.to }
  })
}
