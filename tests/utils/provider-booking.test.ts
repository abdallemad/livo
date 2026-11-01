import { test } from "node:test"
import assert from "node:assert/strict"
import {
  autoReleaseAt,
  declinePaymentChanges,
  objectionWindowHours,
  paymentSummary,
  providerActionBlockedReason,
  providerActionsFor,
} from "@/utils/provider-booking"

test("each status offers only its valid actions", () => {
  assert.deepEqual(providerActionsFor("PENDING_PROVIDER"), ["ACCEPT", "DECLINE"])
  assert.deepEqual(providerActionsFor("CONFIRMED"), ["START"])
  assert.deepEqual(providerActionsFor("IN_PROGRESS"), ["FINISH"])
  for (const s of ["PENDING_PAYMENT", "AWAITING_CONFIRMATION", "COMPLETED", "CLOSED", "CANCELLED", "REJECTED", "DISPUTED"] as const) {
    assert.deepEqual(providerActionsFor(s), [], s)
  }
})

test("actions are refused from the wrong status, with a reason", () => {
  assert.equal(providerActionBlockedReason("START", "CONFIRMED", true), null)
  assert.match(providerActionBlockedReason("START", "PENDING_PROVIDER", true)!, /moved on/)
  assert.match(providerActionBlockedReason("FINISH", "DISPUTED", true)!, /dispute/)
  assert.match(providerActionBlockedReason("ACCEPT", "CANCELLED", true)!, /closed/)
})

test("only an active provider may accept; accepted work can still be finished", () => {
  assert.match(providerActionBlockedReason("ACCEPT", "PENDING_PROVIDER", false)!, /isn't active/)
  assert.equal(providerActionBlockedReason("DECLINE", "PENDING_PROVIDER", false), null)
  assert.equal(providerActionBlockedReason("FINISH", "IN_PROGRESS", false), null)
})

test("objection window reads the setting with a safe default (BR-08)", () => {
  assert.equal(objectionWindowHours(48), 48)
  assert.equal(objectionWindowHours("72"), 72)
  assert.equal(objectionWindowHours(null), 48)
  assert.equal(objectionWindowHours(0), 48)
  assert.equal(objectionWindowHours(100000), 720)
  assert.equal(autoReleaseAt(new Date("2026-11-01T10:00:00Z"), 48).toISOString(), "2026-11-03T10:00:00.000Z")
})

test("declining fails unpaid checkouts and fully refunds held money", () => {
  const changes = declinePaymentChanges([
    { id: "a", method: "ONLINE", amount: 500, refundedAmount: 0, status: "PENDING", escrowState: "NONE" },
    { id: "b", method: "ONLINE", amount: 800, refundedAmount: 0, status: "PAID", escrowState: "HELD" },
    { id: "c", method: "CASH", amount: 300, refundedAmount: 0, status: "FAILED", escrowState: "NONE" },
  ])
  assert.deepEqual(changes, [
    { id: "a", status: "FAILED", escrowState: "NONE", refundedAmount: 0 },
    { id: "b", status: "REFUNDED", escrowState: "REFUNDED", refundedAmount: 800 },
  ])
})

test("payment summary in plain words", () => {
  assert.match(paymentSummary("CASH", [{ status: "PENDING", escrowState: "NONE" }]), /collect from the customer/)
  assert.match(paymentSummary("ONLINE", [{ status: "PAID", escrowState: "HELD" }]), /Livo holds it/)
  assert.match(paymentSummary("ONLINE", [{ status: "PAID", escrowState: "RELEASED" }]), /released to your wallet/)
  assert.match(paymentSummary("ONLINE", [{ status: "PENDING", escrowState: "NONE" }]), /Waiting/)
  assert.equal(paymentSummary(null, []), "No payment yet")
})

test("the place is the area until contact is unlocked, then the full address (BR-02)", async () => {
  const { bookingPlace, firstName } = await import("@/utils/provider-booking")
  const snap = { street: "9 Road 9", details: "Flat 12", area: "Maadi", city: "Cairo" }
  assert.equal(bookingPlace(snap, false), "Maadi, Cairo")
  assert.equal(bookingPlace(snap, true), "9 Road 9, Flat 12, Maadi, Cairo")
  assert.equal(bookingPlace(null, true), null)
  assert.equal(firstName("  Sara Ibrahim "), "Sara")
  assert.equal(firstName(null), null)
})

test("a cancelled or declined booking never says 'collect cash'", () => {
  assert.equal(paymentSummary("CASH", [{ status: "FAILED", escrowState: "NONE" }], "REJECTED"), "Cancelled — no payment")
  assert.equal(paymentSummary("ONLINE", [{ status: "FAILED", escrowState: "NONE" }], "CANCELLED"), "Cancelled — no payment")
  assert.match(paymentSummary("ONLINE", [{ status: "REFUNDED", escrowState: "REFUNDED" }], "REJECTED"), /Refunded/)
})
