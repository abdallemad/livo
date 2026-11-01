import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveCommissionRate, splitAmount } from "@/utils/commission"

const plumbing = { id: "plumbing", parentId: null }
const leaks = { id: "leaks", parentId: "plumbing" }

test("no override → the global rate", () => {
  assert.deepEqual(resolveCommissionRate(leaks, [], 10), { rate: 10, source: "GLOBAL" })
})

test("a category's own override wins over its parent and the global rate", () => {
  const overrides = [
    { categoryId: "plumbing", ratePercent: 12, isActive: true },
    { categoryId: "leaks", ratePercent: 8, isActive: true },
  ]
  assert.deepEqual(resolveCommissionRate(leaks, overrides, 10), { rate: 8, source: "CATEGORY" })
  assert.deepEqual(resolveCommissionRate(plumbing, overrides, 10), { rate: 12, source: "CATEGORY" })
})

test("a sub-category inherits its parent's override", () => {
  assert.deepEqual(resolveCommissionRate(leaks, [{ categoryId: "plumbing", ratePercent: 12, isActive: true }], 10), {
    rate: 12,
    source: "PARENT",
  })
})

test("inactive overrides are ignored, and a 0% override is still an override", () => {
  assert.deepEqual(resolveCommissionRate(leaks, [{ categoryId: "leaks", ratePercent: 5, isActive: false }], 10), { rate: 10, source: "GLOBAL" })
  assert.deepEqual(resolveCommissionRate(leaks, [{ categoryId: "leaks", ratePercent: 0, isActive: true }], 10), { rate: 0, source: "CATEGORY" })
})

test("splitAmount rounds commission and net to piastres", () => {
  assert.deepEqual(splitAmount(350, 10), { commission: 35, providerNet: 315 })
  assert.deepEqual(splitAmount(333.33, 12.5), { commission: 41.67, providerNet: 291.66 })
})
