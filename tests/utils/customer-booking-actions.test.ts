import { test } from "node:test"
import assert from "node:assert/strict"
import { customerBookingStatusSchema } from "@/schemas/customer-account.schema"
import {
  bookingStages,
  canReportProblem,
  cancellationPlan,
  completionPlan,
  customerActionBlockedReason,
  customerActionsFor,
  type CustomerPayment,
} from "@/utils/customer-booking-actions"

const online = (over: Partial<CustomerPayment> = {}): CustomerPayment => ({ id: "p1", method: "ONLINE", amount: 1000, refundedAmount: 0, status: "PAID", escrowState: "HELD", ...over })
const cash = (over: Partial<CustomerPayment> = {}): CustomerPayment => ({ id: "c1", method: "CASH", amount: 500, refundedAmount: 0, status: "PENDING", escrowState: "NONE", ...over })

test("actions per status", () => {
  assert.deepEqual(customerActionsFor("PENDING_PAYMENT"), ["CANCEL"])
  assert.deepEqual(customerActionsFor("PENDING_PROVIDER"), ["CANCEL"])
  assert.deepEqual(customerActionsFor("CONFIRMED"), [])
  assert.deepEqual(customerActionsFor("AWAITING_CONFIRMATION"), ["CONFIRM"])
  assert.deepEqual(customerActionsFor("COMPLETED"), [])
})

test("blocked reasons", () => {
  assert.equal(customerActionBlockedReason("CONFIRM", "AWAITING_CONFIRMATION", false), null)
  assert.match(customerActionBlockedReason("CONFIRM", "AWAITING_CONFIRMATION", true)!, /dispute/)
  assert.match(customerActionBlockedReason("CANCEL", "CONFIRMED", false)!, /already accepted/)
  assert.match(customerActionBlockedReason("CANCEL", "CANCELLED", false)!, /closed/)
  assert.match(customerActionBlockedReason("CONFIRM", "IN_PROGRESS", false)!, /moved on/)
})

test("report a problem only while the job is live and undisputed", () => {
  assert.equal(canReportProblem("CONFIRMED", false), true)
  assert.equal(canReportProblem("AWAITING_CONFIRMATION", true), false)
  assert.equal(canReportProblem("PENDING_PROVIDER", false), false)
  assert.equal(canReportProblem("COMPLETED", false), false)
})

test("confirming releases held online money to the wallet, net of commission", () => {
  const plan = completionPlan({ payments: [online()], commissionRate: 10, commissionAmount: 100, walletCreditedSoFar: 0 })
  assert.deepEqual(plan.payments, [{ id: "p1", status: "PAID", escrowState: "RELEASED", refundedAmount: 0, release: true }])
  assert.deepEqual(plan.wallet, [{ type: "EARNING", amount: 900 }])
  assert.equal(plan.released, 1000)
})

test("confirming nets out refunds and earlier credits", () => {
  const plan = completionPlan({ payments: [online({ status: "PARTIALLY_REFUNDED", refundedAmount: 200 })], commissionRate: 10, commissionAmount: 100, walletCreditedSoFar: 300 })
  assert.deepEqual(plan.wallet, [{ type: "EARNING", amount: 420 }]) // 800 × 0.9 − 300
})

test("confirming a cash job marks the cash paid and charges the commission to the wallet", () => {
  const plan = completionPlan({ payments: [cash()], commissionRate: 12, commissionAmount: 60, walletCreditedSoFar: 0 })
  assert.deepEqual(plan.payments, [{ id: "c1", status: "PAID", escrowState: "NONE", refundedAmount: 0, paid: true }])
  assert.deepEqual(plan.wallet, [{ type: "COMMISSION_DEBT", amount: -60 }])
  assert.equal(plan.released, 0)
})

test("cancelling refunds held money in full and fails unpaid attempts", () => {
  const plan = cancellationPlan([online({ id: "old", status: "FAILED", escrowState: "NONE" }), online()])
  assert.deepEqual(plan.payments, [{ id: "p1", status: "REFUNDED", escrowState: "REFUNDED", refundedAmount: 1000 }])
  assert.equal(plan.refund, 1000)
  const unpaid = cancellationPlan([online({ status: "PENDING", escrowState: "NONE" }), cash()])
  assert.deepEqual(unpaid.payments.map((p) => p.status), ["FAILED", "FAILED"])
  assert.equal(unpaid.refund, 0)
})

test("progress stages", () => {
  assert.deepEqual(bookingStages("PENDING_PAYMENT", "ONLINE")!.map((s) => s.state), ["done", "current", "todo", "todo", "todo", "todo"])
  assert.deepEqual(bookingStages("CONFIRMED", "CASH")!.map((s) => `${s.label}:${s.state}`), ["Booked:done", "Accepted:done", "Work started:current", "Marked done:todo", "Confirmed:todo"])
  assert.ok(bookingStages("COMPLETED", "ONLINE")!.every((s) => s.state === "done"))
  assert.equal(bookingStages("DISPUTED", "ONLINE"), null)
})

test("status schema", () => {
  assert.equal(customerBookingStatusSchema.safeParse({ status: "COMPLETED" }).success, true)
  assert.equal(customerBookingStatusSchema.safeParse({ status: "CANCELLED", reason: "" }).data?.status, "CANCELLED")
  assert.equal(customerBookingStatusSchema.safeParse({ status: "CANCELLED", reason: "x".repeat(501) }).success, false)
  assert.equal(customerBookingStatusSchema.safeParse({ status: "IN_PROGRESS" }).success, false)
})
