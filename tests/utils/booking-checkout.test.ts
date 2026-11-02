import { test } from "node:test"
import assert from "node:assert/strict"
import { createServiceBookingSchema } from "@/schemas/booking.schema"
import { DEFAULT_WEEK } from "@/utils/availability"
import {
  BOOKING_MAX_DAYS,
  bookableDays,
  nextBookingNumber,
  overlapsBusy,
  slotInstant,
  slotLength,
  slotProblem,
  startTimesFor,
  toMinorUnits,
} from "@/utils/booking-checkout"
import { zonedIsoDay } from "@/utils/zoned-time"

// Monday 2 Nov 2026, 10:00 in Cairo (UTC+2 in November).
const NOW = new Date("2026-11-02T08:00:00Z")
const NO_HOURS = [] as typeof DEFAULT_WEEK
const ctx = (over: Partial<Parameters<typeof slotProblem>[2]> = {}) => ({ now: NOW, hours: DEFAULT_WEEK, busy: [], durationMinutes: 90, ...over })

test("slotInstant converts a Cairo day + time to one UTC instant", () => {
  assert.equal(slotInstant("2026-11-03", "09:00")?.toISOString(), "2026-11-03T07:00:00.000Z")
  assert.equal(slotInstant("2026-11-03", "25:00"), null)
  assert.equal(slotInstant("2026-13-40", "09:00"), null)
  assert.equal(slotInstant("nope", "09:00"), null)
})

test("start times follow the provider's hours, or 08:00–20:00 when none are set", () => {
  assert.deepEqual(startTimesFor(DEFAULT_WEEK, 5), []) // Friday off
  const tue = startTimesFor(DEFAULT_WEEK, 2)
  assert.equal(tue[0], "09:00")
  assert.equal(tue.at(-1), "17:30")
  const fallback = startTimesFor(NO_HOURS, 5)
  assert.equal(fallback[0], "08:00")
  assert.equal(fallback.at(-1), "19:30")
})

test("slotProblem: lead time, window, working hours, grid", () => {
  assert.equal(slotProblem("2026-11-02", "11:00", ctx()), "Choose a time at least 2 hours from now.")
  assert.equal(slotProblem("2026-11-02", "12:00", ctx()), null)
  assert.match(slotProblem("2026-12-30", "10:00", ctx())!, /within the next/)
  assert.match(slotProblem("2026-11-06", "10:00", ctx())!, /doesn't work/) // Friday
  assert.match(slotProblem("2026-11-03", "19:00", ctx())!, /doesn't work/)
  assert.equal(slotProblem("2026-11-03", "10:15", ctx()), "Choose a valid date and time.")
  assert.equal(slotProblem("2026-11-06", "10:00", ctx({ hours: NO_HOURS })), null)
  assert.match(slotProblem("2026-11-06", "21:00", ctx({ hours: NO_HOURS }))!, /doesn't work/)
})

test("a start that overlaps an existing booking is refused", () => {
  const busy = [slotInstant("2026-11-03", "10:00")!]
  assert.match(slotProblem("2026-11-03", "11:00", ctx({ busy }))!, /just booked/) // 90 min job
  assert.equal(slotProblem("2026-11-03", "11:30", ctx({ busy })), null)
  assert.match(slotProblem("2026-11-03", "09:00", ctx({ busy }))!, /just booked/)
  assert.equal(slotLength(null), 60)
  assert.equal(slotLength(180), 180)
  assert.equal(overlapsBusy(busy[0], [], 60), false)
})

test("bookableDays offers only free starts inside the window", () => {
  const busy = [slotInstant("2026-11-03", "09:00")!]
  const days = bookableDays(ctx({ busy, durationMinutes: 60 }))
  assert.equal(days[0].date, "2026-11-02")
  assert.equal(days[0].times[0], "12:00") // lead time
  assert.ok(!days.some((d) => d.date === "2026-11-06")) // Fridays off
  const tue = days.find((d) => d.date === "2026-11-03")!
  assert.equal(tue.times[0], "10:00")
  const last = zonedIsoDay(new Date(NOW.getTime() + BOOKING_MAX_DAYS * 86_400_000))
  assert.ok(days.every((d) => d.date <= last))
})

test("money and numbering", () => {
  assert.equal(toMinorUnits(350), 35_000)
  assert.equal(toMinorUnits(199.99), 19_999)
  assert.equal(nextBookingNumber(null, 2026), "LV-2026-000001")
  assert.equal(nextBookingNumber("LV-2026-000123", 2026), "LV-2026-000124")
  assert.equal(nextBookingNumber("LV-2025-000900", 2026), "LV-2026-000001")
})

test("the booking schema refuses contact details in notes and unknown payment methods", () => {
  const ok = { serviceId: "s1", date: "2026-11-03", time: "10:00", addressId: "a1", paymentMethod: "ONLINE" }
  assert.equal(createServiceBookingSchema.safeParse(ok).success, true)
  assert.equal(createServiceBookingSchema.safeParse({ ...ok, notes: "" }).data?.notes, undefined)
  assert.equal(createServiceBookingSchema.safeParse({ ...ok, notes: "call me 01012345678" }).success, false)
  assert.equal(createServiceBookingSchema.safeParse({ ...ok, paymentMethod: "BITCOIN" }).success, false)
})
