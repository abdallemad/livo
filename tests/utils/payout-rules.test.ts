import { test } from "node:test"
import assert from "node:assert/strict"
import { availableForPayout, payoutBlockedReason } from "@/utils/payout-rules"

test("available = balance minus other approved payouts", () => {
  assert.equal(availableForPayout(6000, 0), 6000)
  assert.equal(availableForPayout(6000, 5000), 1000)
  assert.equal(availableForPayout(100.1, 0.2), 99.9)
})

test("approve needs a REQUESTED payout covered by the available balance", () => {
  assert.equal(payoutBlockedReason("APPROVE", { status: "REQUESTED", amount: 5000 }, 5000), null)
  assert.match(payoutBlockedReason("APPROVE", { status: "REQUESTED", amount: 5000 }, 4999.99)!, /available balance is 4999.99 EGP/)
  assert.match(payoutBlockedReason("APPROVE", { status: "APPROVED", amount: 10 }, 100)!, /already approved/)
})

test("mark paid needs APPROVED and re-checks the balance", () => {
  assert.equal(payoutBlockedReason("MARK_PAID", { status: "APPROVED", amount: 400 }, 400), null)
  assert.match(payoutBlockedReason("MARK_PAID", { status: "REQUESTED", amount: 400 }, 1000)!, /Approve the payout/)
  assert.match(payoutBlockedReason("MARK_PAID", { status: "APPROVED", amount: 400 }, 300)!, /less than/)
})

test("reject works from REQUESTED or APPROVED regardless of balance, never after a final state", () => {
  assert.equal(payoutBlockedReason("REJECT", { status: "REQUESTED", amount: 9999 }, 0), null)
  assert.equal(payoutBlockedReason("REJECT", { status: "APPROVED", amount: 9999 }, -50), null)
  assert.match(payoutBlockedReason("REJECT", { status: "PAID", amount: 1 }, 10)!, /already paid/)
  assert.match(payoutBlockedReason("APPROVE", { status: "REJECTED", amount: 1 }, 10)!, /rejected/)
})
