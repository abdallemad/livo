import type { BookingStatus, EscrowState, PaymentMethod, PaymentStatus } from "@prisma/client"

/**
 * The customer's view of bookings and payments (CU-13, BR-02, BR-08; docs/customer-account-feature.md)
 * — pure and tested.
 */

export const CUSTOMER_BOOKING_TABS = {
  current: ["PENDING_PAYMENT", "PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "DISPUTED"],
  finished: ["COMPLETED", "CLOSED"],
  cancelled: ["CANCELLED", "REJECTED"],
} as const satisfies Record<string, BookingStatus[]>

export type CustomerBookingTab = keyof typeof CUSTOMER_BOOKING_TABS

/** One sentence: what happens next / what the customer should do. `deadline` is pre-formatted. */
export function customerNextStep(status: BookingStatus, opts: { deadline?: string | null; reviewed?: boolean } = {}): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Finish paying to send the booking to the provider."
    case "PENDING_PROVIDER":
      return "Waiting for the provider to accept. You'll get a notification."
    case "CONFIRMED":
      return "Confirmed. You can now call or message the provider."
    case "IN_PROGRESS":
      return "The provider is working on it."
    case "AWAITING_CONFIRMATION":
      return opts.deadline
        ? `The provider marked it done. Confirm, or report a problem before ${opts.deadline}.`
        : "The provider marked it done. Confirm, or report a problem."
    case "DISPUTED":
      return "You reported a problem. Our team is looking into it; the payment stays on hold."
    case "COMPLETED":
    case "CLOSED":
      return opts.reviewed ? "Done. Thanks for your review." : "Done. Tell others how it went — leave a review."
    case "CANCELLED":
      return "Cancelled."
    case "REJECTED":
      return "The provider couldn't take this booking. Anything you paid is refunded."
  }
}

/** The provider's phone is shared both ways only once the booking is confirmed (BR-02, SY-04). */
export const contactVisible = (contactUnlocked: boolean, status: BookingStatus) =>
  contactUnlocked && ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(status)

/** A payment in the customer's words (escrow explained, BR-08). */
export function customerPaymentLabel(method: PaymentMethod, status: PaymentStatus, escrow: EscrowState): string {
  if (status === "PENDING") return method === "CASH" ? "Cash — pay the provider when the job is done" : "Waiting for your payment"
  if (status === "FAILED") return "Not completed"
  if (status === "REFUNDED") return "Refunded to you"
  if (method === "CASH") return "Paid in cash"
  if (escrow === "HELD") return "Paid — held safely by Livo until you confirm the job"
  if (status === "PARTIALLY_REFUNDED") return "Paid — partly refunded"
  return "Paid — passed to the provider"
}

export interface CustomerPaymentTotals {
  /** What reached Livo or the provider (online captured + cash marked paid), before refunds. */
  paid: number
  refunded: number
  /** Online money Livo still holds for jobs not confirmed yet. */
  held: number
}

const cents = (n: number) => Math.round(n * 100) / 100

export function customerPaymentTotals(
  payments: { method: PaymentMethod; status: PaymentStatus; escrowState: EscrowState; amount: number; refundedAmount: number }[],
): CustomerPaymentTotals {
  let paid = 0
  let refunded = 0
  let held = 0
  for (const p of payments) {
    if (p.status === "PENDING" || p.status === "FAILED") continue
    paid += p.amount
    refunded += p.refundedAmount
    if (p.escrowState === "HELD" && (p.status === "PAID" || p.status === "PARTIALLY_REFUNDED")) held += p.amount - p.refundedAmount
  }
  return { paid: cents(paid), refunded: cents(refunded), held: cents(held) }
}
