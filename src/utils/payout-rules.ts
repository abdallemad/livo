import type { PayoutStatus } from "@prisma/client"

/**
 * Payout request rules (AD-07, PR-11, PR-12) — pure, used by the admin list (to disable buttons
 * with a reason) and by the service (to refuse), so both say the same thing.
 * docs/admin-commission-payouts-feature.md.
 *
 * Wallet model: the ledger is append-only and `balance = SUM(WalletTransaction.amount)`. The
 * `PAYOUT` row (−amount) is written only when the money is actually sent (APPROVED → PAID).
 * Until then an APPROVED payout **reserves** its amount, so two approvals can't spend the same
 * balance. Other REQUESTED payouts don't reserve anything — the admin decides them one by one.
 *
 *   REQUESTED ──approve──▶ APPROVED ──mark paid──▶ PAID (writes the PAYOUT ledger row)
 *       └──────reject──────────┴──────reject────▶ REJECTED
 */

export type PayoutAction = "APPROVE" | "REJECT" | "MARK_PAID"

export const PAYOUT_TRANSITIONS: Record<PayoutAction, { from: PayoutStatus[]; to: PayoutStatus; audit: string }> = {
  APPROVE: { from: ["REQUESTED"], to: "APPROVED", audit: "payout.approve" },
  REJECT: { from: ["REQUESTED", "APPROVED"], to: "REJECTED", audit: "payout.reject" },
  MARK_PAID: { from: ["APPROVED"], to: "PAID", audit: "payout.mark_paid" },
}

const cents = (n: number) => Math.round(n * 100) / 100

/** What the provider can still withdraw: ledger balance minus OTHER approved-but-unpaid payouts. */
export function availableForPayout(balance: number, otherApprovedTotal: number) {
  return cents(balance - otherApprovedTotal)
}

/** `null` when the action is allowed, otherwise the sentence shown to the admin (409 on the server). */
export function payoutBlockedReason(
  action: PayoutAction,
  payout: { status: PayoutStatus; amount: number },
  available: number,
): string | null {
  const { from } = PAYOUT_TRANSITIONS[action]
  if (!from.includes(payout.status)) {
    if (payout.status === "PAID") return "This payout was already paid."
    if (payout.status === "REJECTED") return "This payout was rejected."
    if (action === "MARK_PAID") return "Approve the payout before marking it paid."
    return "This payout was already approved."
  }
  if (action === "REJECT") return null
  if (!(payout.amount > 0)) return "The payout amount must be above zero."
  if (payout.amount > available) {
    return `The provider's available balance is ${cents(available)} EGP, less than the ${cents(payout.amount)} EGP requested. Reject the request instead.`
  }
  return null
}
