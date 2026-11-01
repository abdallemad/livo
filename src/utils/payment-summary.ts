import type { EscrowState, PaymentMethod, PaymentStatus } from "@prisma/client"

/**
 * Money totals for `/admin/payments` (AD-07, docs/admin-payments-feature.md) — pure, so the
 * buckets are unit tested and match the dispute money rule (`utils/dispute-settlement.ts`):
 *
 *  - **Captured** online money is a payment that is PAID / PARTIALLY_REFUNDED / REFUNDED
 *    (it reached Livo at some point). Cash never passes through Livo and is counted apart.
 *  - **Held** = what is still in escrow: PAID / PARTIALLY_REFUNDED with escrow HELD,
 *    minus anything already refunded.
 *  - **Released** = captured money whose escrow is RELEASED or PARTIALLY_REFUNDED (a partial
 *    refund releases the rest to the provider), minus what was refunded.
 *  - **Refunded** = `refundedAmount` across online payments.
 *  - So for online money: `captured = held + released + refunded` (cents-rounded).
 */

/** One `groupBy(method, status, escrowState)` bucket from the repository. */
export interface PaymentGroup {
  method: PaymentMethod
  status: PaymentStatus
  escrowState: EscrowState
  count: number
  amount: number
  refundedAmount: number
}

export interface PaymentSummary {
  /** Online money that reached Livo (gross, before refunds). */
  captured: number
  capturedCount: number
  /** Still held in escrow. */
  held: number
  heldCount: number
  /** Passed on to providers. */
  released: number
  /** Returned to customers. */
  refunded: number
  refundedCount: number
  /** Cash jobs marked paid (never passed through Livo). */
  cash: number
  cashCount: number
  /** Checkouts not completed yet. */
  pending: number
  pendingCount: number
  failedCount: number
}

const cents = (n: number) => Math.round(n * 100) / 100

const CAPTURED: PaymentStatus[] = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"]
const STILL_LIVE: PaymentStatus[] = ["PAID", "PARTIALLY_REFUNDED"]

export function summarizePayments(groups: PaymentGroup[]): PaymentSummary {
  const s: PaymentSummary = {
    captured: 0,
    capturedCount: 0,
    held: 0,
    heldCount: 0,
    released: 0,
    refunded: 0,
    refundedCount: 0,
    cash: 0,
    cashCount: 0,
    pending: 0,
    pendingCount: 0,
    failedCount: 0,
  }

  for (const g of groups) {
    if (g.status === "PENDING") {
      s.pending += g.amount
      s.pendingCount += g.count
      continue
    }
    if (g.status === "FAILED") {
      s.failedCount += g.count
      continue
    }
    if (g.method === "CASH") {
      if (g.status === "PAID") {
        s.cash += g.amount
        s.cashCount += g.count
      }
      continue
    }
    if (!CAPTURED.includes(g.status)) continue

    s.captured += g.amount
    s.capturedCount += g.count
    if (g.refundedAmount > 0) {
      s.refunded += g.refundedAmount
      s.refundedCount += g.count
    }
    if (!STILL_LIVE.includes(g.status)) continue
    const remaining = g.amount - g.refundedAmount
    if (g.escrowState === "HELD") {
      s.held += remaining
      s.heldCount += g.count
    } else if (g.escrowState === "RELEASED" || g.escrowState === "PARTIALLY_REFUNDED") {
      s.released += remaining
    }
  }

  for (const key of ["captured", "held", "released", "refunded", "cash", "pending"] as const) s[key] = cents(s[key])
  return s
}
