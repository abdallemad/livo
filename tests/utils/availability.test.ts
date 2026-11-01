import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_WEEK, dayError, isWithinHours, normalizeWeek, timeLabel, TIME_OPTIONS, toMinutes, weeklyMinutes } from "@/utils/availability"

test("times parse on a 30-minute grid up to 24:00", () => {
  assert.equal(toMinutes("09:30"), 570)
  assert.equal(toMinutes("24:00"), 1440)
  assert.equal(toMinutes("24:30"), null)
  assert.equal(toMinutes("9:00"), null)
  assert.equal(TIME_OPTIONS.length, 49)
  assert.equal(timeLabel("13:30"), "1:30 PM")
  assert.equal(timeLabel("00:00"), "Midnight")
})

test("a day's ranges must be ordered, on the grid, not overlapping, at most 3", () => {
  assert.equal(dayError([{ start: "09:00", end: "13:00" }, { start: "16:00", end: "21:00" }]), null)
  assert.equal(dayError([]), null)
  assert.match(dayError([{ start: "10:00", end: "09:00" }])!, /after the start/)
  assert.match(dayError([{ start: "09:15", end: "10:00" }])!, /half hours/)
  assert.match(dayError([{ start: "09:00", end: "13:00" }, { start: "12:30", end: "14:00" }])!, /overlap/)
  assert.match(dayError(Array.from({ length: 4 }, (_, i) => ({ start: `0${i}:00`, end: `0${i}:30` })))!, /At most 3/)
})

test("the week is normalized Sat → Fri with sorted ranges", () => {
  const week = normalizeWeek([{ weekday: 1, ranges: [{ start: "16:00", end: "20:00" }, { start: "08:00", end: "12:00" }] }])
  assert.deepEqual(week.map((d) => d.weekday), [6, 0, 1, 2, 3, 4, 5])
  assert.deepEqual(week[2].ranges.map((r) => r.start), ["08:00", "16:00"])
  assert.equal(weeklyMinutes(DEFAULT_WEEK), 6 * 9 * 60)
})

test("bookings inside / outside hours; no hours set → unknown", () => {
  assert.equal(isWithinHours(DEFAULT_WEEK, 0, 9 * 60), true)
  assert.equal(isWithinHours(DEFAULT_WEEK, 0, 18 * 60), false) // the end is exclusive
  assert.equal(isWithinHours(DEFAULT_WEEK, 5, 12 * 60), false) // Friday off
  assert.equal(isWithinHours(normalizeWeek([]), 0, 600), null)
})

test("Cairo weekday and minutes", async () => {
  const { zonedWeekdayMinutes } = await import("@/utils/zoned-time")
  // Sun 1 Nov 2026 22:30 UTC = Mon 2 Nov 00:30 Cairo
  assert.deepEqual(zonedWeekdayMinutes(new Date("2026-11-01T22:30:00Z")), { weekday: 1, minutes: 30 })
})
