import { test } from "node:test"
import assert from "node:assert/strict"
import { availableResolutions, planDisputeSettlement, SettlementError } from "@/utils/dispute-settlement"

const heldPayment = { id: "p1", amount: 1000, refundedAmount: 0, status: "PAID" as const, escrowState: "HELD" as const }
const releasedPayment = { id: "p0", amount: 500, refundedAmount: 0, status: "PAID" as const, escrowState: "RELEASED" as const }
const cashPending = { id: "c1", amount: 300, refundedAmount: 0, status: "PENDING" as const, escrowState: "NONE" as const }
const base = { commissionRate: 10, walletCreditedSoFar: 0 }

test("releasing held money credits the provider's net and releases the payment", () => {
  const plan = planDisputeSettlement({ ...base, resolution: "RELEASE_TO_PROVIDER", payments: [heldPayment] })
  assert.equal(plan.refundNow, 0)
  assert.equal(plan.providerNetAfter, 900)
  assert.equal(plan.commissionAfter, 100)
  assert.equal(plan.walletDelta, 900)
  assert.deepEqual(plan.payments, [{ id: "p1", refundedAmount: 0, status: "PAID", escrowState: "RELEASED", release: true }])
})

test("a full refund returns everything and claws back what was already credited", () => {
  const plan = planDisputeSettlement({
    ...base,
    walletCreditedSoFar: 450, // 500 released earlier, net of 10%
    resolution: "FULL_REFUND",
    payments: [releasedPayment, heldPayment],
  })
  assert.equal(plan.refundable, 1500)
  assert.equal(plan.refundNow, 1500)
  assert.equal(plan.providerNetAfter, 0)
  assert.equal(plan.walletDelta, -450)
  assert.deepEqual(
    plan.payments.map((p) => [p.id, p.status, p.escrowState, p.refundedAmount]),
    [
      ["p1", "REFUNDED", "REFUNDED", 1000],
      ["p0", "REFUNDED", "REFUNDED", 500],
    ],
  )
})

test("a partial refund comes out of held money first and releases the rest", () => {
  const plan = planDisputeSettlement({ ...base, resolution: "PARTIAL_REFUND", refundAmount: 300, payments: [heldPayment] })
  assert.equal(plan.refundNow, 300)
  assert.equal(plan.providerNetAfter, 630) // (1000 - 300) × 90%
  assert.equal(plan.walletDelta, 630)
  assert.deepEqual(plan.payments, [{ id: "p1", refundedAmount: 300, status: "PARTIALLY_REFUNDED", escrowState: "PARTIALLY_REFUNDED", release: true }])
})

test("a partial refund larger than the held money reaches into released money", () => {
  const plan = planDisputeSettlement({
    ...base,
    walletCreditedSoFar: 450,
    resolution: "PARTIAL_REFUND",
    refundAmount: 1200,
    payments: [releasedPayment, heldPayment],
  })
  assert.deepEqual(
    plan.payments.map((p) => [p.id, p.refundedAmount, p.status]),
    [
      ["p1", 1000, "REFUNDED"],
      ["p0", 200, "PARTIALLY_REFUNDED"],
    ],
  )
  assert.equal(plan.providerNetAfter, 270) // (1500 - 1200) × 90%
  assert.equal(plan.walletDelta, -180)
})

test("partial refund amounts are validated", () => {
  const args = { ...base, resolution: "PARTIAL_REFUND" as const, payments: [heldPayment] }
  assert.throws(() => planDisputeSettlement({ ...args, refundAmount: 0 }), (e: unknown) => e instanceof SettlementError && e.field === "refundAmount")
  assert.throws(() => planDisputeSettlement({ ...args, refundAmount: 1000 }), /full refund/)
})

test("cash disputes can only be closed without moving money", () => {
  assert.deepEqual(availableResolutions([cashPending]), ["NO_ACTION"])
  const plan = planDisputeSettlement({ ...base, resolution: "NO_ACTION", payments: [cashPending] })
  assert.equal(plan.walletDelta, 0)
  assert.deepEqual(plan.payments, [])
  assert.throws(() => planDisputeSettlement({ ...base, resolution: "FULL_REFUND", payments: [cashPending] }), /nothing to refund/)
  assert.throws(() => planDisputeSettlement({ ...base, resolution: "RELEASE_TO_PROVIDER", payments: [cashPending] }), /No money is held/)
})

test("no action never writes to the wallet, even if older ledger rows don't add up", () => {
  const plan = planDisputeSettlement({ ...base, walletCreditedSoFar: 400, resolution: "NO_ACTION", payments: [releasedPayment] })
  assert.equal(plan.walletDelta, 0)
  assert.equal(plan.providerNetAfter, 400)
  assert.deepEqual(plan.payments, [])
})

test("no action is refused while money is held", () => {
  assert.throws(() => planDisputeSettlement({ ...base, resolution: "NO_ACTION", payments: [heldPayment] }), /still held/)
  assert.deepEqual(availableResolutions([heldPayment]), ["RELEASE_TO_PROVIDER", "PARTIAL_REFUND", "FULL_REFUND"])
  assert.deepEqual(availableResolutions([releasedPayment]), ["NO_ACTION", "PARTIAL_REFUND", "FULL_REFUND"])
})
