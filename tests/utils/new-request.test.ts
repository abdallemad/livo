import { test } from "node:test"
import assert from "node:assert/strict"
import { composeDescription, contactProblem, expiryDays, preferredDateProblem, requestExpiresAt, takesQuotes } from "@/utils/new-request"

test("only quote categories take requests", () => {
  assert.equal(takesQuotes("QUOTE"), true)
  assert.equal(takesQuotes("BOTH"), true)
  assert.equal(takesQuotes("FIXED"), false)
})

test("the approximate size becomes the description's first line", () => {
  assert.equal(composeDescription("  Tile the kitchen floor.  ", 12), "Approximate size: 12 m²\n\nTile the kitchen floor.")
  assert.equal(composeDescription("Tile the kitchen floor.", null), "Tile the kitchen floor.")
  assert.equal(composeDescription("Tile the kitchen floor.", 0), "Tile the kitchen floor.")
})

test("contact details are refused (SY-04), ordinary numbers are fine", () => {
  assert.match(contactProblem("Call me 01012345678")!, /phone numbers/)
  assert.match(contactProblem("me@example.com")!, /emails/)
  assert.equal(contactProblem("Flat 140 m², 3 rooms, budget 15000"), null)
})

test("expiry follows the setting (BR-05) with a safe default", () => {
  assert.equal(expiryDays(7), 7)
  assert.equal(expiryDays("14"), 14)
  assert.equal(expiryDays(null), 7)
  assert.equal(expiryDays(0), 7)
  assert.equal(expiryDays(90), 7)
  assert.equal(requestExpiresAt(new Date("2026-11-01T10:00:00Z"), 7).toISOString(), "2026-11-08T10:00:00.000Z")
})

test("preferred date: today or later, within the window", () => {
  assert.equal(preferredDateProblem("2026-11-01", "2026-11-01"), null)
  assert.equal(preferredDateProblem("2027-02-28", "2026-11-01"), null)
  assert.match(preferredDateProblem("2026-10-31", "2026-11-01")!, /today or a later/)
  assert.match(preferredDateProblem("2027-06-01", "2026-11-01")!, /within the next 120 days/)
  assert.match(preferredDateProblem("2026-13-40", "2026-11-01")!, /valid date/)
})
