import { test } from "node:test"
import assert from "node:assert/strict"
import { planImageChanges, serviceDeleteBlockedReason, serviceStatusText, validateOrder } from "@/utils/provider-catalog"

test("photos: keep, reorder, add pending, drop the rest", () => {
  assert.deepEqual(planImageChanges(["a", "b"], ["b", "p1", "a"], ["p1", "p2"], 5), { attach: ["b", "p1", "a"], remove: [] })
  assert.deepEqual(planImageChanges(["a", "b"], ["p2"], ["p1", "p2"], 5), { attach: ["p2"], remove: ["a", "b"] })
  assert.deepEqual(planImageChanges([], [], [], 5), { attach: [], remove: [] })
})

test("photos: someone else's or unknown ids and too many are refused", () => {
  assert.throws(() => planImageChanges(["a"], ["x"], ["p1"], 5), /missing/)
  assert.throws(() => planImageChanges([], ["p1", "p2", "p3"], ["p1", "p2", "p3"], 2), /At most 2/)
  assert.deepEqual(planImageChanges([], ["p1", "p1"], ["p1"], 1).attach, ["p1"]) // duplicates collapse
})

test("reorder must list exactly the current items once", () => {
  assert.deepEqual(validateOrder(["a", "b", "c"], ["c", "a", "b"]), ["c", "a", "b"])
  assert.throws(() => validateOrder(["a", "b"], ["a"]), /changed/)
  assert.throws(() => validateOrder(["a", "b"], ["a", "a"]), /changed/)
  assert.throws(() => validateOrder(["a", "b"], ["a", "x"]), /changed/)
})

test("services with bookings can't be deleted", () => {
  assert.equal(serviceDeleteBlockedReason(0), null)
  assert.match(serviceDeleteBlockedReason(1)!, /1 booking,/)
  assert.match(serviceDeleteBlockedReason(3)!, /Switch it off/)
})

test("status text explains every visibility state", () => {
  assert.match(serviceStatusText("LIVE", null), /book it/)
  assert.match(serviceStatusText("HIDDEN_BY_ADMIN", "Misleading photos"), /Misleading photos/)
  assert.match(serviceStatusText("PROVIDER_INACTIVE", null), /account is active/)
})
