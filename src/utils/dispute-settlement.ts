import type { DisputeResolution, EscrowState, PaymentStatus } from "@prisma/client"

/**
 * How a dispute decision moves money (AD-05, BR-08, PR-11) — pure, so the
 * admin preview and the service compute exactly the same thing, and it is
 * unit tested (docs/admin-disputes-reviews-feature.md).
 *
 * Model:
 *  - Only captured ONLINE money moves: payments that are PAID / PARTIALLY_REFUNDED
 *    with escrow HELD, RELEASED or PARTIALLY_REFUNDED. Cash never passed through
 *    Livo, so a cash dispute can only be closed with NO_ACTION.
 *  - A dispute is final: every payment still HELD ends RELEASED or REFUNDED.
 *  - Refunds come out of HELD money first, then out of RELEASED money (newest first).
 *  - Commission is charged on what the customer finally pays, so the provider's
 *    wallet for this booking must end at `(captured − refunded) × (1 − rate)`.
 *    The difference from what was already credited is one EARNING (+) or
 *    REFUND_CLAWBACK (−) ledger row.
 */

export interface SettlementPayment {
  id: string
  amount: number
  refundedAmount: number
  status: PaymentStatus
  escrowState: EscrowState
}

export interface SettlementInput {
  resolution: DisputeResolution
  /** Required for PARTIAL_REFUND, ignored otherwise. */
  refundAmount?: number | null
  /** Percent, from the booking's frozen snapshot (BR-01). */
  commissionRate: number
  payments: SettlementPayment[]
  /** Sum of this booking's EARNING + REFUND_CLAWBACK wallet rows so far. */
  walletCreditedSoFar: number
}

export interface PaymentChange {
  id: string
  refundedAmount: number
  status: PaymentStatus
  escrowState: EscrowState
  /** True when held money is released to the provider now. */
  release: boolean
}

export interface SettlementPlan {
  /** Money still in Livo's hands before the decision. */
  held: number
  /** Money already released to the provider before the decision. */
  released: number
  /** Most that can still be refunded (captured − already refunded). */
  refundable: number
  /** What the customer gets back by this decision. */
  refundNow: number
  /** The provider's net for this booking after the decision. */
  providerNetAfter: number
  /** Livo's commission for this booking after the decision. */
  commissionAfter: number
  /** Ledger row to write: > 0 EARNING, < 0 REFUND_CLAWBACK, 0 none. */
  walletDelta: number
  payments: PaymentChange[]
}

export class SettlementError extends Error {
  // A plain field (not a constructor parameter property) so Node's type stripping can run the tests.
  readonly field?: "resolution" | "refundAmount"

  constructor(message: string, field?: "resolution" | "refundAmount") {
    super(message)
    this.name = "SettlementError"
    this.field = field
  }
}

const cents = (n: number) => Math.round(n * 100) / 100

const isCaptured = (p: SettlementPayment) =>
  (p.status === "PAID" || p.status === "PARTIALLY_REFUNDED") &&
  (p.escrowState === "HELD" || p.escrowState === "RELEASED" || p.escrowState === "PARTIALLY_REFUNDED")

const remaining = (p: SettlementPayment) => cents(p.amount - p.refundedAmount)

export function planDisputeSettlement(input: SettlementInput): SettlementPlan {
  const captured = input.payments.filter(isCaptured)
  const heldPayments = captured.filter((p) => p.escrowState === "HELD")
  const releasedPayments = captured.filter((p) => p.escrowState !== "HELD")
  const held = cents(heldPayments.reduce((s, p) => s + remaining(p), 0))
  const released = cents(releasedPayments.reduce((s, p) => s + remaining(p), 0))
  const refundable = cents(held + released)
  const alreadyRefunded = cents(captured.reduce((s, p) => s + p.refundedAmount, 0))
  const capturedTotal = cents(captured.reduce((s, p) => s + p.amount, 0))

  let refundNow: number
  switch (input.resolution) {
    case "FULL_REFUND":
      if (refundable <= 0) throw new SettlementError("Nothing was paid through Livo, so there is nothing to refund.", "resolution")
      refundNow = refundable
      break
    case "PARTIAL_REFUND": {
      if (refundable <= 0) throw new SettlementError("Nothing was paid through Livo, so there is nothing to refund.", "resolution")
      const amount = cents(input.refundAmount ?? 0)
      if (!(amount > 0)) throw new SettlementError("Enter the amount to refund.", "refundAmount")
      if (amount >= refundable) {
        throw new SettlementError(`A partial refund must be less than the ${refundable} EGP that can be refunded. Use a full refund instead.`, "refundAmount")
      }
      refundNow = amount
      break
    }
    case "RELEASE_TO_PROVIDER":
      if (held <= 0) throw new SettlementError("No money is held for this booking. Close the dispute with “No action”.", "resolution")
      refundNow = 0
      break
    case "NO_ACTION":
      if (held > 0) throw new SettlementError("Money is still held. Release it to the provider or refund the customer.", "resolution")
      refundNow = 0
      break
  }

  // Allocate the refund: held money first, then released money (newest first = input order reversed).
  let left = refundNow
  const changes: PaymentChange[] = []
  for (const p of [...heldPayments, ...[...releasedPayments].reverse()]) {
    const take = cents(Math.min(left, remaining(p)))
    left = cents(left - take)
    const refundedAmount = cents(p.refundedAmount + take)
    const fully = refundedAmount >= p.amount
    if (take > 0) {
      changes.push({
        id: p.id,
        refundedAmount,
        status: fully ? "REFUNDED" : "PARTIALLY_REFUNDED",
        escrowState: fully ? "REFUNDED" : "PARTIALLY_REFUNDED",
        release: !fully && p.escrowState === "HELD",
      })
    } else if (p.escrowState === "HELD") {
      // The decision is final: whatever is still held goes to the provider.
      changes.push({ id: p.id, refundedAmount: p.refundedAmount, status: p.status, escrowState: "RELEASED", release: true })
    }
  }

  // "No action" means no money moves at all — not even a correction of older ledger rows.
  if (input.resolution === "NO_ACTION") {
    const net = cents(input.walletCreditedSoFar)
    const paid = cents(capturedTotal - alreadyRefunded)
    return { held, released, refundable, refundNow: 0, providerNetAfter: net, commissionAfter: cents(paid - net), walletDelta: 0, payments: [] }
  }

  const rate = input.commissionRate / 100
  const finalPaid = cents(capturedTotal - alreadyRefunded - refundNow)
  const providerNetAfter = cents(finalPaid * (1 - rate))
  return {
    held,
    released,
    refundable,
    refundNow,
    providerNetAfter,
    commissionAfter: cents(finalPaid - providerNetAfter),
    walletDelta: cents(providerNetAfter - input.walletCreditedSoFar),
    payments: changes,
  }
}

/** Resolutions that make sense for the money on this booking (the form only offers these). */
export function availableResolutions(payments: SettlementPayment[]): DisputeResolution[] {
  const captured = payments.filter(isCaptured)
  const held = captured.some((p) => p.escrowState === "HELD" && remaining(p) > 0)
  const refundable = captured.some((p) => remaining(p) > 0)
  if (held) return ["RELEASE_TO_PROVIDER", "PARTIAL_REFUND", "FULL_REFUND"]
  if (refundable) return ["NO_ACTION", "PARTIAL_REFUND", "FULL_REFUND"]
  return ["NO_ACTION"]
}
