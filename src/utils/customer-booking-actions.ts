import type { BookingStatus, EscrowState, PaymentMethod, PaymentStatus } from "@prisma/client"

/**
 * The customer's side of the booking state machine (CU-09, CU-11, BR-06, BR-08; docs/customer-booking-detail-feature.md)
 * — pure, used by the page (which buttons to show) and the service (what to refuse, how money moves), and unit tested.
 *
 *   PENDING_PAYMENT ─┐
 *   PENDING_PROVIDER ┴─cancel──▶ CANCELLED          (before the provider accepts: free, full refund)
 *   AWAITING_CONFIRMATION ──confirm──▶ COMPLETED    (CU-09: held money is released to the provider)
 *
 * Cancelling after the provider accepted is the BR-06 cancellation policy ("depends on the time left before the
 * appointment, details later") — not offered until that policy is decided; the customer reports a problem instead.
 */

export type CustomerBookingAction = "CONFIRM" | "CANCEL"

export const CUSTOMER_BOOKING_TRANSITIONS: Record<CustomerBookingAction, { from: BookingStatus[]; to: BookingStatus; audit: string }> = {
  CONFIRM: { from: ["AWAITING_CONFIRMATION"], to: "COMPLETED", audit: "booking.customer_confirm" },
  CANCEL: { from: ["PENDING_PAYMENT", "PENDING_PROVIDER"], to: "CANCELLED", audit: "booking.customer_cancel" },
}

export const CUSTOMER_CANCEL_REASON_MAX = 500

export function customerActionsFor(status: BookingStatus): CustomerBookingAction[] {
  return (Object.keys(CUSTOMER_BOOKING_TRANSITIONS) as CustomerBookingAction[]).filter((a) => CUSTOMER_BOOKING_TRANSITIONS[a].from.includes(status))
}

/** `null` when allowed, otherwise the sentence shown to the customer (409 on the server). */
export function customerActionBlockedReason(action: CustomerBookingAction, status: BookingStatus, hasOpenDispute: boolean): string | null {
  if (hasOpenDispute) return "There's an open dispute on this booking. Our team will settle it."
  if (CUSTOMER_BOOKING_TRANSITIONS[action].from.includes(status)) return null
  if (status === "CANCELLED" || status === "REJECTED") return "This booking is closed."
  if (action === "CANCEL" && ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(status)) {
    return "The provider already accepted, so the booking can't be cancelled here. Report a problem or contact support."
  }
  return "This booking has moved on. Reload to see its latest status."
}

/** "Report a problem" (CU-12) is offered from acceptance until the job is confirmed, once per booking. */
export const canReportProblem = (status: BookingStatus, hasDispute: boolean) =>
  !hasDispute && ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(status)

export interface CustomerPayment {
  id: string
  method: PaymentMethod
  amount: number
  refundedAmount: number
  status: PaymentStatus
  escrowState: EscrowState
}

const cents = (n: number) => Math.round(n * 100) / 100

const isCapturedHeld = (p: CustomerPayment) => p.method === "ONLINE" && (p.status === "PAID" || p.status === "PARTIALLY_REFUNDED") && p.escrowState === "HELD"

export interface PaymentUpdate {
  id: string
  status: PaymentStatus
  escrowState: EscrowState
  refundedAmount: number
  /** Released to the provider now (sets `releasedAt`). */
  release?: boolean
  /** Cash marked paid now (sets `paidAt`). */
  paid?: boolean
}

export interface CompletionPlan {
  payments: PaymentUpdate[]
  /** Ledger rows to write (PR-11): EARNING (+) for released online money, COMMISSION_DEBT (−) for a cash job. */
  wallet: { type: "EARNING" | "COMMISSION_DEBT"; amount: number }[]
  /** Online money released to the provider by this confirmation (gross, before commission). */
  released: number
}

/**
 * What confirming the job (CU-09) does to money — the same model as the seed and the dispute settlement:
 *  - online money still HELD → RELEASED; the provider's wallet gets `(captured − refunded) × (1 − rate)` minus anything
 *    this booking already credited (so a partial dispute settlement isn't paid twice);
 *  - a cash job → the cash payment is PAID (the customer confirms they paid the provider), and Livo's commission is
 *    taken from the provider's wallet as COMMISSION_DEBT (cash never passed through Livo).
 */
export function completionPlan(input: { payments: CustomerPayment[]; commissionRate: number; commissionAmount: number; walletCreditedSoFar: number }): CompletionPlan {
  const payments: PaymentUpdate[] = []
  const wallet: CompletionPlan["wallet"] = []
  let net = 0
  let released = 0

  for (const p of input.payments) {
    if (isCapturedHeld(p)) {
      payments.push({ id: p.id, status: p.status, escrowState: "RELEASED", refundedAmount: p.refundedAmount, release: true })
      released += p.amount - p.refundedAmount
      net += (p.amount - p.refundedAmount) * (1 - input.commissionRate / 100)
    }
  }
  const earning = cents(net - input.walletCreditedSoFar)
  if (released > 0 && earning > 0) wallet.push({ type: "EARNING", amount: earning })

  const cash = input.payments.find((p) => p.method === "CASH" && p.status === "PENDING")
  if (cash) {
    payments.push({ id: cash.id, status: "PAID", escrowState: "NONE", refundedAmount: 0, paid: true })
    if (input.commissionAmount > 0) wallet.push({ type: "COMMISSION_DEBT", amount: -cents(input.commissionAmount) })
  }
  return { payments, wallet, released: cents(released) }
}

/**
 * What cancelling before acceptance does: an unpaid checkout fails; captured online money still HELD is refunded in
 * full (nothing was released to the provider, so the wallet is untouched); a cash payment that was never collected fails.
 */
export function cancellationPlan(payments: CustomerPayment[]): { payments: PaymentUpdate[]; refund: number } {
  const changes: PaymentUpdate[] = []
  let refund = 0
  for (const p of payments) {
    if (p.status === "PENDING") changes.push({ id: p.id, status: "FAILED", escrowState: p.escrowState, refundedAmount: p.refundedAmount })
    else if (isCapturedHeld(p)) {
      changes.push({ id: p.id, status: "REFUNDED", escrowState: "REFUNDED", refundedAmount: p.amount })
      refund += p.amount - p.refundedAmount
    }
  }
  return { payments: changes, refund: cents(refund) }
}

export type StageState = "done" | "current" | "todo"

/**
 * The booking's progress in the customer's words (SITEMAP §7 "customer pages show the current state as a timeline"):
 * Booked → Paid (online only) → Accepted → Work started → Marked done → Confirmed. `null` for a cancelled, declined or
 * disputed booking — the page shows a banner and the dated history instead.
 */
export function bookingStages(status: BookingStatus, method: PaymentMethod | null): { label: string; state: StageState }[] | null {
  if (status === "CANCELLED" || status === "REJECTED" || status === "DISPUTED") return null
  const labels = ["Booked", ...(method === "ONLINE" ? ["Paid"] : []), "Accepted", "Work started", "Marked done", "Confirmed"]
  const reached: Record<Exclude<BookingStatus, "CANCELLED" | "REJECTED" | "DISPUTED">, string> = {
    PENDING_PAYMENT: "Paid",
    PENDING_PROVIDER: "Accepted",
    CONFIRMED: "Work started",
    IN_PROGRESS: "Marked done",
    AWAITING_CONFIRMATION: "Confirmed",
    COMPLETED: "",
    CLOSED: "",
  }
  const currentIndex = reached[status] ? labels.indexOf(reached[status]) : labels.length
  return labels.map((label, i) => ({ label, state: i < currentIndex ? "done" : i === currentIndex ? "current" : "todo" }))
}
