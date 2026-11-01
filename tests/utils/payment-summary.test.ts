import { test } from "node:test"
import assert from "node:assert/strict"
import { summarizePayments, type PaymentGroup } from "@/utils/payment-summary"

const g = (over: Partial<PaymentGroup>): PaymentGroup => ({
  method: "ONLINE",
  status: "PAID",
  escrowState: "HELD",
  count: 1,
  amount: 0,
  refundedAmount: 0,
  ...over,
})

test("empty input gives zero totals", () => {
  const s = summarizePayments([])
  assert.equal(s.captured, 0)
  assert.equal(s.held, 0)
  assert.equal(s.failedCount, 0)
})

test("online money splits into held, released and refunded, which add up to captured", () => {
  const s = summarizePayments([
    g({ escrowState: "HELD", count: 2, amount: 1000 }),
    g({ escrowState: "RELEASED", amount: 500 }),
    // partial refund of a held payment: 300 back to the customer, the rest released
    g({ status: "PARTIALLY_REFUNDED", escrowState: "PARTIALLY_REFUNDED", amount: 800, refundedAmount: 300 }),
    g({ status: "REFUNDED", escrowState: "REFUNDED", amount: 200, refundedAmount: 200 }),
  ])
  assert.equal(s.captured, 2500)
  assert.equal(s.capturedCount, 5)
  assert.equal(s.held, 1000)
  assert.equal(s.heldCount, 2)
  assert.equal(s.released, 1000)
  assert.equal(s.refunded, 500)
  assert.equal(s.refundedCount, 2)
  assert.equal(s.held + s.released + s.refunded, s.captured)
})

test("cash never counts as captured or held", () => {
  const s = summarizePayments([g({ method: "CASH", escrowState: "NONE", amount: 700, count: 3 })])
  assert.equal(s.captured, 0)
  assert.equal(s.held, 0)
  assert.equal(s.cash, 700)
  assert.equal(s.cashCount, 3)
})

test("pending and failed checkouts are counted, not collected", () => {
  const s = summarizePayments([
    g({ status: "PENDING", escrowState: "NONE", amount: 450, count: 2 }),
    g({ method: "CASH", status: "PENDING", escrowState: "NONE", amount: 50 }),
    g({ status: "FAILED", escrowState: "NONE", amount: 999, count: 4 }),
  ])
  assert.equal(s.captured, 0)
  assert.equal(s.pending, 500)
  assert.equal(s.pendingCount, 3)
  assert.equal(s.failedCount, 4)
})

test("totals are rounded to cents", () => {
  const s = summarizePayments([g({ amount: 0.1 }), g({ amount: 0.2 })])
  assert.equal(s.captured, 0.3)
  assert.equal(s.held, 0.3)
})
