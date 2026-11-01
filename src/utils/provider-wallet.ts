import type { WalletTxType } from "@prisma/client"

/**
 * The provider's wallet and payout requests (PR-11, PR-12; docs/provider-earnings-payouts-feature.md)
 * — pure and tested. Same ledger model as the admin side (docs/admin-commission-payouts-feature.md):
 * `balance = SUM(WalletTransaction.amount)`; the PAYOUT row (−amount) is written when an admin marks
 * the payout paid, so until then an open request must be subtracted to know what's left.
 */

export const PAYOUT_MIN = 100
export const PAYOUT_MAX = 100_000

const cents = (n: number) => Math.round(n * 100) / 100

/**
 * What the provider can still ask for: balance minus every OPEN payout (REQUESTED + APPROVED).
 * Stricter than the admin check (which only subtracts APPROVED ones) so a provider can't request
 * the same money twice; never below 0.
 */
export function availableToRequest(balance: number, openPayoutsTotal: number) {
  return Math.max(0, cents(balance - openPayoutsTotal))
}

/** Money paid online and still held in escrow, as the provider's future net (BR-08): (paid − refunded) × (1 − rate). */
export function heldNet(payments: { amount: number; refundedAmount: number; commissionRate: number }[]) {
  return cents(payments.reduce((s, p) => s + (p.amount - p.refundedAmount) * (1 - p.commissionRate / 100), 0))
}

export interface PayoutRequestCheck {
  providerApproved: boolean
  hasOpenRequest: boolean
  amount: number
  available: number
}

/** `null` when the request may be sent, otherwise the sentence shown (409 / 422 on the server). */
export function payoutRequestBlockedReason(c: PayoutRequestCheck): string | null {
  if (!c.providerApproved) return "Your account isn't active, so you can't request payouts right now."
  if (c.hasOpenRequest) return "You already have a payout request waiting. You can request again once it's handled."
  if (c.available < PAYOUT_MIN) return `You can request a payout once you have at least ${PAYOUT_MIN} EGP available.`
  if (!(c.amount >= PAYOUT_MIN)) return `The minimum payout is ${PAYOUT_MIN} EGP.`
  if (c.amount > c.available) return `You can request up to ${c.available} EGP.`
  return null
}

export type PayoutDestinationType = "WALLET" | "BANK"

const DIGITS: Record<string, string> = Object.fromEntries(
  [..."٠١٢٣٤٥٦٧٨٩"].map((d, i) => [d, String(i)]).concat([..."۰۱۲۳۴۵۶۷۸۹"].map((d, i) => [d, String(i)])),
)
const westernDigits = (s: string) => s.replace(/[٠-٩۰-۹]/g, (d) => DIGITS[d] ?? d)

/**
 * Normalizes where the money goes, or explains what's wrong.
 * WALLET: an Egyptian mobile wallet number (Vodafone Cash, Etisalat Cash…, 01xxxxxxxxx) or an
 * InstaPay address (`name@instapay`). BANK: an Egyptian IBAN (EG + 27 digits) or an account number (10–20 digits).
 */
export function normalizeDestination(type: PayoutDestinationType, raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = westernDigits(raw).trim()
  // Dots and dashes are separators in numbers, but part of an InstaPay address — check that first.
  if (type === "WALLET" && /^[a-z0-9._]{3,40}@instapay$/i.test(trimmed)) return { ok: true, value: trimmed.toLowerCase() }
  const compact = trimmed.replace(/[\s\-.]/g, "")
  if (type === "WALLET") {
    const local = compact.replace(/^(\+20|0020)/, "0")
    if (/^01[0125]\d{8}$/.test(local)) return { ok: true, value: local }
    return { ok: false, error: "Enter your wallet number (01…, 11 digits) or InstaPay address (name@instapay)." }
  }
  const upper = compact.toUpperCase()
  if (/^EG\d{27}$/.test(upper)) return { ok: true, value: upper }
  if (/^\d{10,20}$/.test(upper)) return { ok: true, value: upper }
  return { ok: false, error: "Enter your IBAN (EG + 27 digits) or your account number (10–20 digits)." }
}

/** "••••5678" — never print a full account number in lists. Already-masked values pass through. */
export function maskDestination(ref: string): string {
  if (ref.includes("•")) return ref
  if (ref.includes("@")) return ref.replace(/^(.{2}).*(@.*)$/, "$1•••$2")
  return ref.length <= 4 ? ref : `••••${ref.slice(-4)}`
}

export const LEDGER_LABEL: Record<WalletTxType, string> = {
  EARNING: "Earning",
  COMMISSION_DEBT: "Commission on a cash job",
  PAYOUT: "Payout sent",
  REFUND_CLAWBACK: "Refund taken back",
  ADJUSTMENT: "Adjustment by Livo",
}

export const LEDGER_HELP: Record<WalletTxType, string> = {
  EARNING: "Your share of an online payment after Livo's commission, released after the customer confirmed.",
  COMMISSION_DEBT: "The customer paid you in cash, so Livo's commission is taken from your wallet.",
  PAYOUT: "Money sent to your bank or wallet.",
  REFUND_CLAWBACK: "Part of an earning returned to the customer after a dispute.",
  ADJUSTMENT: "A manual correction by Livo's team.",
}
