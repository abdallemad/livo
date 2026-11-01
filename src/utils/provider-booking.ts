import type { BookingStatus, EscrowState, PaymentMethod, PaymentStatus } from "@prisma/client"

/**
 * The provider's side of the booking state machine (PR-08, SITEMAP §7,
 * docs/provider-quotes-bookings-feature.md) — pure, used by the pages (which buttons to show)
 * and the service (what to refuse), and unit tested.
 *
 *   PENDING_PROVIDER ──accept──▶ CONFIRMED ──start──▶ IN_PROGRESS ──mark done──▶ AWAITING_CONFIRMATION
 *          └──decline──▶ REJECTED
 *
 * After AWAITING_CONFIRMATION the customer confirms (CU-09) or the objection window ends (BR-08);
 * cancelling a confirmed booking is the BR-06 cancellation policy, still undecided — not offered here.
 */

export type ProviderBookingAction = "ACCEPT" | "DECLINE" | "START" | "FINISH"

export const PROVIDER_BOOKING_TRANSITIONS: Record<ProviderBookingAction, { from: BookingStatus; to: BookingStatus; audit: string }> = {
  ACCEPT: { from: "PENDING_PROVIDER", to: "CONFIRMED", audit: "booking.provider_accept" },
  DECLINE: { from: "PENDING_PROVIDER", to: "REJECTED", audit: "booking.provider_decline" },
  START: { from: "CONFIRMED", to: "IN_PROGRESS", audit: "booking.start" },
  FINISH: { from: "IN_PROGRESS", to: "AWAITING_CONFIRMATION", audit: "booking.provider_done" },
}

/** The status each action is sent as (`PATCH …/status { status }`). */
export const ACTION_BY_TARGET: Partial<Record<BookingStatus, ProviderBookingAction>> = {
  CONFIRMED: "ACCEPT",
  REJECTED: "DECLINE",
  IN_PROGRESS: "START",
  AWAITING_CONFIRMATION: "FINISH",
}

export function providerActionsFor(status: BookingStatus): ProviderBookingAction[] {
  return (Object.keys(PROVIDER_BOOKING_TRANSITIONS) as ProviderBookingAction[]).filter((a) => PROVIDER_BOOKING_TRANSITIONS[a].from === status)
}

/**
 * `null` when allowed, otherwise the sentence shown to the provider (409 on the server).
 * Only an ACTIVE (approved) provider may take on new work; work already accepted can still be finished.
 */
export function providerActionBlockedReason(action: ProviderBookingAction, status: BookingStatus, providerApproved: boolean): string | null {
  const { from } = PROVIDER_BOOKING_TRANSITIONS[action]
  if (status !== from) {
    if (status === "CANCELLED" || status === "REJECTED") return "This booking is closed."
    if (status === "DISPUTED") return "There's an open dispute on this booking. Our team will contact you."
    return "This booking has moved on. Reload to see its latest status."
  }
  if (action === "ACCEPT" && !providerApproved) return "Your account isn't active, so you can't accept new bookings."
  return null
}

/** Bookings the provider never sees: the customer hasn't paid yet, so it isn't a booking for them. */
export const HIDDEN_FROM_PROVIDER: BookingStatus[] = ["PENDING_PAYMENT"]

export const PROVIDER_BOOKING_TABS = {
  current: ["PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "DISPUTED"],
  finished: ["COMPLETED", "CLOSED"],
  cancelled: ["CANCELLED", "REJECTED"],
} as const satisfies Record<string, BookingStatus[]>

export type ProviderBookingTab = keyof typeof PROVIDER_BOOKING_TABS

/** `SiteSetting["booking.objectionWindowHours"]` (BR-08); 48 h if missing or invalid, capped at 30 days. */
export function objectionWindowHours(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.round(n), 720) : 48
}

export const autoReleaseAt = (now: Date, hours: number) => new Date(now.getTime() + hours * 3_600_000)

export interface ProviderPayment {
  id: string
  method: PaymentMethod
  amount: number
  refundedAmount: number
  status: PaymentStatus
  escrowState: EscrowState
}

/**
 * What declining does to the booking's payments: an unpaid checkout fails; money captured and still
 * HELD goes back to the customer in full (nothing was ever released to the provider, so the wallet
 * is untouched). Recorded on the payment row — no gateway is wired yet.
 */
export function declinePaymentChanges(payments: ProviderPayment[]) {
  const changes: { id: string; status: PaymentStatus; escrowState: EscrowState; refundedAmount: number }[] = []
  for (const p of payments) {
    if (p.status === "PENDING") changes.push({ id: p.id, status: "FAILED", escrowState: p.escrowState, refundedAmount: p.refundedAmount })
    else if ((p.status === "PAID" || p.status === "PARTIALLY_REFUNDED") && p.escrowState === "HELD") {
      changes.push({ id: p.id, status: "REFUNDED", escrowState: "REFUNDED", refundedAmount: p.amount })
    }
  }
  return changes
}

/** One line a provider understands about how they get paid for this booking. */
export function paymentSummary(
  method: PaymentMethod | null,
  payments: Pick<ProviderPayment, "status" | "escrowState">[],
  bookingStatus?: BookingStatus,
): string {
  const closed = bookingStatus === "CANCELLED" || bookingStatus === "REJECTED"
  if (closed && !payments.some((p) => p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED")) return "Cancelled — no payment"
  if (!method) return "No payment yet"
  if (method === "CASH") {
    return payments.some((p) => p.status === "PAID") ? "Paid in cash" : "Cash — collect from the customer when the job is done"
  }
  if (payments.some((p) => p.escrowState === "RELEASED")) return "Paid online — released to your wallet"
  if (payments.some((p) => p.escrowState === "HELD")) return "Paid online — Livo holds it until the job is confirmed"
  if (payments.some((p) => p.status === "REFUNDED")) return "Refunded to the customer"
  if (payments.some((p) => p.status === "PENDING")) return "Waiting for the customer's payment"
  return "Online payment"
}

/**
 * Where the job is, as the provider may see it (BR-02): area + city until contact is unlocked at
 * confirmation, then the full address snapshot (street, details, area, city).
 */
export function bookingPlace(snapshot: unknown, unlocked: boolean): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  const s = snapshot as Record<string, unknown>
  const keys = unlocked ? ["street", "details", "area", "city"] : ["area", "city"]
  const parts = keys.map((k) => s[k]).filter((v): v is string => typeof v === "string" && v.trim() !== "")
  return parts.length ? parts.join(", ") : null
}

export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] || null
