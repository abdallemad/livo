import { test } from "node:test"
import assert from "node:assert/strict"
import { zonedDayRange, zonedDaysBetween, zonedMonthRange } from "@/utils/zoned-time"

test("a Cairo day in winter (UTC+2) starts at 22:00 UTC the day before", () => {
  const { start, end } = zonedDayRange(new Date("2026-11-01T10:00:00Z"))
  assert.equal(start.toISOString(), "2026-10-31T22:00:00.000Z")
  assert.equal(end.toISOString(), "2026-11-01T22:00:00.000Z")
})

test("late evening UTC already belongs to the next Cairo day", () => {
  const { start } = zonedDayRange(new Date("2026-11-01T23:30:00Z"))
  assert.equal(start.toISOString(), "2026-11-01T22:00:00.000Z")
})

test("summer time (UTC+3) is read from the zone, not hard-coded", () => {
  const { start } = zonedDayRange(new Date("2026-07-15T12:00:00Z"))
  assert.equal(start.toISOString(), "2026-07-14T21:00:00.000Z")
})

test("month range crosses year end", () => {
  const { start, end } = zonedMonthRange(new Date("2026-12-20T12:00:00Z"))
  assert.equal(start.toISOString(), "2026-11-30T22:00:00.000Z")
  assert.equal(end.toISOString(), "2026-12-31T22:00:00.000Z")
})

test("days between counts local calendar days", () => {
  const now = new Date("2026-11-01T21:00:00Z") // 23:00 Cairo, Nov 1
  assert.equal(zonedDaysBetween(now, new Date("2026-11-01T22:30:00Z")), 1) // 00:30 Cairo, Nov 2
  assert.equal(zonedDaysBetween(now, new Date("2026-11-01T08:00:00Z")), 0)
  assert.equal(zonedDaysBetween(now, new Date("2026-10-29T08:00:00Z")), -3)
})

test("formatters print Cairo time whatever the server's zone", async () => {
  const { formatZonedTime, formatZonedDay } = await import("@/utils/zoned-time")
  assert.match(formatZonedTime("2026-11-01T21:30:00Z"), /11:30/)
  assert.match(formatZonedDay("2026-11-01T22:30:00Z"), /Nov 2|2 Nov/) // 00:30 Cairo is already the 2nd
})
