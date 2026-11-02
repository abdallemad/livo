import "server-only"
import type { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { customerBookingRepository as repo, type CustomerBookingDetailRow } from "@/repositories/customer-booking.repository"
import { ledgerRepository } from "@/repositories/ledger.repository"
import type { CustomerBookingStatusValues } from "@/schemas/customer-account.schema"
import { expireOpenSession, refundOnStripe } from "@/services/booking-checkout.service"
import type { CustomerBookingDetail, CustomerBookingStatusDto } from "@/types/customer-account"
import { bookingEvents } from "@/utils/booking-admin"
import { contactVisible, customerNextStep, customerPaymentLabel, customerPaymentTotals } from "@/utils/customer-booking"
import {
  canReportProblem,
  cancellationPlan,
  completionPlan,
  CUSTOMER_BOOKING_TRANSITIONS,
  customerActionBlockedReason,
  customerActionsFor,
  type CustomerBookingAction,
  type PaymentUpdate,
} from "@/utils/customer-booking-actions"
import { formatPrice } from "@/utils/format"
import { bookingPlace } from "@/utils/provider-booking"
import { formatZonedDateTime } from "@/utils/zoned-time"

/**
 * One of the customer's bookings (`/account/bookings/[id]`) and the two things the customer can do to it:
 * confirm the job is done (CU-09, BR-08) and cancel before the provider accepts (CU-11) —
 * docs/customer-booking-detail-feature.md. The customer id always comes from the session; someone else's booking is a 404.
 *
 * Money follows the same model as the seed and the dispute settlement (docs/admin-disputes-reviews-feature.md):
 * confirming releases held online money to the provider's wallet (EARNING) or, for a cash job, marks the cash paid and
 * takes Livo's commission from the provider's wallet (COMMISSION_DEBT). Cancelling refunds held online money in full —
 * recorded on the payment row and sent to Stripe right after the transaction commits.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const titleOf = (b: { service: { title: string } | null; request: { title: string } | null }) => b.service?.title ?? b.request?.title ?? "Booking"
const openDispute = (b: { dispute: { status: string } | null }) => !!b.dispute && b.dispute.status !== "RESOLVED"

function toDetail(b: CustomerBookingDetailRow, customerId: string, reviewed: boolean): CustomerBookingDetail {
  const payments = b.payments.map((p) => ({ ...p, amount: num(p.amount), refundedAmount: num(p.refundedAmount) }))
  const first = payments[0]
  const visible = contactVisible(b.contactUnlockedAt !== null, b.status)
  const done = b.status === "COMPLETED" || b.status === "CLOSED"
  const totals = customerPaymentTotals(payments)
  const hasDispute = !!b.dispute
  const closed = b.status === "CANCELLED" || b.status === "REJECTED"

  return {
    id: b.id,
    number: b.number,
    source: b.source,
    title: titleOf(b),
    status: b.status,
    scheduledAt: b.scheduledAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    amount: num(b.amount),
    place: bookingPlace(b.addressSnapshot, true),
    providerId: b.provider.userId,
    providerName: b.provider.user.name || "Your provider",
    providerPhone: visible ? b.provider.user.phone : null,
    paymentMethod: first?.method ?? null,
    paymentLabel: first ? customerPaymentLabel(first.method, first.status, first.escrowState) : null,
    nextStep: customerNextStep(b.status, { deadline: b.autoReleaseAt ? formatZonedDateTime(b.autoReleaseAt) : null, reviewed }),
    canReview: done && !reviewed,
    serviceId: b.serviceId,
    requestId: b.requestId,
    provider: { id: b.provider.userId, name: b.provider.user.name || "Your provider", avatarUrl: b.provider.user.avatarUrl, phone: visible ? b.provider.user.phone : null },
    notes: b.notes,
    payments: payments
      // Abandoned checkout attempts are noise for the customer once a later attempt exists.
      .filter((p, i) => !(p.status === "FAILED" && p.method === "ONLINE" && i < payments.length - 1))
      .map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: p.amount,
        refundedAmount: p.refundedAmount,
        label: customerPaymentLabel(p.method, p.status, p.escrowState),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    held: totals.held,
    refunded: totals.refunded,
    autoReleaseAt: b.autoReleaseAt?.toISOString() ?? null,
    completedAt: b.completedAt?.toISOString() ?? null,
    events: bookingEvents(b).map((e) => ({ ...e, at: e.at.toISOString() })),
    dispute: b.dispute,
    cancelReason: closed ? b.cancelReason : null,
    closedBy: !closed ? null : b.status === "REJECTED" || b.cancelledById === b.providerId ? "PROVIDER" : b.cancelledById === customerId ? "YOU" : "LIVO",
    actions: openDispute(b) ? [] : customerActionsFor(b.status),
    canPay: b.status === "PENDING_PAYMENT" && payments.some((p) => p.method === "ONLINE"),
    canReportProblem: canReportProblem(b.status, hasDispute),
    canMessage: visible,
    reviewed,
  }
}

/** `GET /api/me/bookings/[id]` and the page's first snapshot; `null` → 404 (unknown or someone else's). */
export async function getMyBooking(customerId: string, id: string): Promise<CustomerBookingDetail | null> {
  const [b, reviewed] = await Promise.all([repo.findDetail(id, customerId), repo.hasReviewed(id, customerId)])
  return b ? toDetail(b, customerId, reviewed) : null
}

const toPaymentData = (c: PaymentUpdate, now: Date): Prisma.PaymentUncheckedUpdateInput => ({
  status: c.status,
  escrowState: c.escrowState,
  refundedAmount: c.refundedAmount,
  ...(c.release ? { releasedAt: now } : {}),
  ...(c.paid ? { paidAt: now } : {}),
})

/** `PATCH /api/me/bookings/[id]/status` — confirm (CU-09) or cancel before acceptance (CU-11). */
export async function updateMyBookingStatus(customerId: string, id: string, input: CustomerBookingStatusValues): Promise<CustomerBookingStatusDto> {
  const action: CustomerBookingAction = input.status === "COMPLETED" ? "CONFIRM" : "CANCEL"
  const t = CUSTOMER_BOOKING_TRANSITIONS[action]
  const now = new Date()

  const result = await repo.transaction(async (tx) => {
    const b = await repo.findDetail(id, customerId, tx)
    if (!b) throw new NotFoundError("That booking doesn't exist.")
    const blocked = customerActionBlockedReason(action, b.status, openDispute(b))
    if (blocked) throw new ConflictError(blocked)

    const payments = b.payments.map((p) => ({ ...p, amount: num(p.amount), refundedAmount: num(p.refundedAmount) }))
    const reason = input.status === "CANCELLED" ? input.reason : undefined
    const data: Prisma.BookingUncheckedUpdateManyInput =
      action === "CONFIRM" ? { status: t.to, completedAt: now } : { status: t.to, cancelledAt: now, cancelledById: customerId, cancelReason: reason ?? "Cancelled by the customer." }
    if ((await repo.transition(id, customerId, t.from, data, tx)) === 0) throw new ConflictError("This booking just changed. Reload to see the latest.")

    let refund = 0
    let released = 0
    let walletNet = 0
    const refunds: { paymentId: string; gatewayPayload: unknown; amount: number }[] = []
    if (action === "CONFIRM") {
      const plan = completionPlan({
        payments,
        commissionRate: num(b.commissionRate),
        commissionAmount: num(b.commissionAmount),
        walletCreditedSoFar: await ledgerRepository.sumBookingEarnings(b.id, tx),
      })
      for (const c of plan.payments) await repo.updatePayment(c.id, toPaymentData(c, now), tx)
      for (const w of plan.wallet) {
        await ledgerRepository.createWalletEntry(
          { providerId: b.providerId, bookingId: b.id, type: w.type, amount: w.amount, note: w.type === "EARNING" ? `Net of booking ${b.number}` : `Commission on cash booking ${b.number}` },
          tx,
        )
        walletNet += w.amount
      }
      released = plan.released
      await ledgerRepository.refreshCompletedCount(b.providerId, tx)
    } else {
      const plan = cancellationPlan(payments)
      for (const c of plan.payments) {
        await repo.updatePayment(c.id, toPaymentData(c, now), tx)
        const p = payments.find((x) => x.id === c.id)!
        if (c.status === "REFUNDED") refunds.push({ paymentId: p.id, gatewayPayload: p.gatewayPayload, amount: p.amount - p.refundedAmount })
      }
      refund = plan.refund
    }

    await auditRepository.createAuditLog(
      {
        actorId: customerId,
        action: t.audit,
        entityType: "Booking",
        entityId: id,
        metadata: { from: b.status, to: t.to, ...(reason ? { reason } : {}), ...(refund ? { refunded: refund } : {}), ...(released ? { released, walletNet } : {}) },
      },
      tx,
    )

    // The provider never saw an unpaid booking (PENDING_PAYMENT), so there's nothing to tell them about it.
    if (action === "CONFIRM" || b.status === "PENDING_PROVIDER") {
      await auditRepository.createNotification(
        {
          userId: b.providerId,
          type: "BOOKING_STATUS_CHANGED",
          title: action === "CONFIRM" ? `The customer confirmed booking ${b.number}` : `The customer cancelled booking ${b.number}`,
          body:
            action === "CONFIRM"
              ? walletNet > 0
                ? `${formatPrice(walletNet)} was added to your wallet.`
                : walletNet < 0
                  ? `Cash job: Livo's ${formatPrice(-walletNet)} commission was taken from your wallet.`
                  : "The job is done."
              : (reason ?? "No reason given."),
          payload: { bookingId: id },
        },
        tx,
      )
    }

    const openSessions = action === "CANCEL" ? b.payments.filter((p) => p.status === "PENDING" && p.gatewayRef).map((p) => p.gatewayRef!) : []
    return { dto: { id, status: t.to, refunded: refund }, refunds, openSessions, number: b.number }
  })

  // Outside the transaction: never hold a DB transaction open on a network call.
  for (const sessionId of result.openSessions) await expireOpenSession(sessionId)
  for (const r of result.refunds) {
    if (await refundOnStripe({ ...r, reason: `Customer cancelled ${result.number}` })) continue
    // Couldn't send it (no gateway data, Stripe down…): the row says REFUNDED, so an admin must finish it by hand.
    await auditRepository.createAuditLog({ actorId: null, action: "payment.refund_failed", entityType: "Booking", entityId: id, metadata: { paymentId: r.paymentId, amount: r.amount } })
    const admins = await repo.findAdminIds()
    await repo.createNotifications(
      admins.map((a) => ({
        userId: a.id,
        type: "PAYMENT_UPDATE" as const,
        title: `Refund for ${result.number} needs a hand`,
        body: `The customer cancelled before acceptance. Refund ${formatPrice(r.amount)} in Stripe — it couldn't be sent automatically.`,
        payload: { bookingId: id, paymentId: r.paymentId },
      })),
    )
  }
  return result.dto
}
