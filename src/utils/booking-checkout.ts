import type { DayHours } from "@/utils/availability"
import { isWithinHours, TIME_STEP_MINUTES, toMinutes } from "@/utils/availability"
import { zonedDayStart, zonedIsoDay, zonedWeekdayMinutes } from "@/utils/zoned-time"

/**
 * Rules for booking a fixed-price service (CU-02, CU-07; docs/booking-checkout-feature.md) — pure and unit tested.
 * Used by the service (what to refuse) and, through the form data it builds, by the wizard (what to offer).
 *
 * Times are the customer's local clock in Livo's zone (Africa/Cairo): a day "YYYY-MM-DD" + a start "HH:MM"
 * on the 30-minute grid. The server converts that to one UTC instant (`Booking.scheduledAt`).
 */

/** The earliest start: now + 2 hours, so the provider has time to accept. */
export const BOOKING_LEAD_MINUTES = 120
/** How far ahead the wizard offers (and the server accepts) a start. */
export const BOOKING_MAX_DAYS = 30
/** Used when the provider hasn't set working hours (`/provider/schedule`): 08:00–20:00 every day. */
export const FALLBACK_HOURS = { start: "08:00", end: "20:00" } as const
/** A booking blocks the provider for at least this long when the service has no duration. */
export const DEFAULT_SLOT_MINUTES = 60
export const BOOKING_NOTES_MAX = 1000

/** The wizard's steps (SITEMAP §3: date/time → address → notes → payment → confirm). */
export const BOOKING_STEPS = ["Date & time", "Address", "Notes", "Payment", "Confirmation"]

export const BOOKING_PAYMENT_METHODS = ["ONLINE", "CASH"] as const
export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number]

const DAY_MS = 86_400_000
const MINUTE_MS = 60_000

/** UTC instant of a local day + "HH:MM", or `null` when the pair doesn't exist on the local clock (bad input / DST gap). */
export function slotInstant(isoDay: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay) || Number.isNaN(Date.parse(`${isoDay}T00:00:00Z`))) return null
  const minutes = toMinutes(time)
  if (minutes === null || minutes >= 24 * 60) return null
  const at = new Date(zonedDayStart(isoDay).getTime() + minutes * MINUTE_MS)
  // Round-trip: the instant must read back as the same local day and time.
  if (zonedIsoDay(at) !== isoDay || zonedWeekdayMinutes(at).minutes !== minutes) return null
  return at
}

/** How long one booking of this service occupies the provider. */
export const slotLength = (durationMinutes: number | null | undefined) => Math.max(durationMinutes ?? 0, DEFAULT_SLOT_MINUTES)

/** Does a start at `at` overlap a booking that already starts at one of `busy` (each lasting `lengthMinutes`)? */
export function overlapsBusy(at: Date, busy: Date[], lengthMinutes: number): boolean {
  const len = lengthMinutes * MINUTE_MS
  return busy.some((b) => at.getTime() < b.getTime() + len && b.getTime() < at.getTime() + len)
}

/** Start times ("HH:MM") inside the provider's hours for a weekday, on the 30-minute grid. */
export function startTimesFor(hours: DayHours[], weekday: number): string[] {
  const noHours = hours.every((d) => d.ranges.length === 0)
  const ranges = noHours ? [FALLBACK_HOURS] : (hours.find((d) => d.weekday === weekday)?.ranges ?? [])
  const out = new Set<string>()
  for (const r of ranges) {
    const start = toMinutes(r.start)
    const end = toMinutes(r.end)
    if (start === null || end === null) continue
    for (let m = Math.ceil(start / TIME_STEP_MINUTES) * TIME_STEP_MINUTES; m < end; m += TIME_STEP_MINUTES) {
      out.add(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
    }
  }
  return [...out].sort()
}

export interface SlotContext {
  now: Date
  hours: DayHours[]
  busy: Date[]
  durationMinutes: number | null
}

/**
 * `null` when the customer may book this start, otherwise the sentence shown under the field (422 on the server).
 * Checked again on submit, so a slot taken while the wizard was open is refused, not double-booked.
 */
export function slotProblem(isoDay: string, time: string, ctx: SlotContext): string | null {
  const at = slotInstant(isoDay, time)
  if (!at || toMinutes(time)! % TIME_STEP_MINUTES !== 0) return "Choose a valid date and time."
  if (at.getTime() < ctx.now.getTime() + BOOKING_LEAD_MINUTES * MINUTE_MS) return "Choose a time at least 2 hours from now."
  if (at.getTime() > ctx.now.getTime() + BOOKING_MAX_DAYS * DAY_MS) return `Choose a time within the next ${BOOKING_MAX_DAYS} days.`
  const { weekday, minutes } = zonedWeekdayMinutes(at)
  const within = isWithinHours(ctx.hours, weekday, minutes)
  if (within === false || (within === null && !startTimesFor(ctx.hours, weekday).includes(time))) return "The provider doesn't work at that time. Pick another."
  if (overlapsBusy(at, ctx.busy, slotLength(ctx.durationMinutes))) return "That time was just booked. Pick another."
  return null
}

export interface BookableDay {
  date: string
  times: string[]
}

/** Every day in the window with at least one free start — what the wizard offers. */
export function bookableDays(ctx: SlotContext): BookableDay[] {
  const days: BookableDay[] = []
  const first = zonedDayStart(zonedIsoDay(ctx.now))
  for (let i = 0; i <= BOOKING_MAX_DAYS; i++) {
    // Noon avoids DST edges when stepping whole days.
    const date = zonedIsoDay(new Date(first.getTime() + i * DAY_MS + 12 * 3_600_000))
    const at = slotInstant(date, "12:00")
    if (!at) continue
    const times = startTimesFor(ctx.hours, zonedWeekdayMinutes(at).weekday).filter((t) => slotProblem(date, t, ctx) === null)
    if (times.length) days.push({ date, times })
  }
  return days
}

/** USD → cents, the integer Stripe expects for a two-decimal currency. */
export const toMinorUnits = (amount: number) => Math.round(amount * 100)

/** "LV-2026-000124": the next human booking number after the year's highest (same format as the seed). */
export function nextBookingNumber(last: string | null, year: number): string {
  const prefix = `LV-${year}-`
  const n = last?.startsWith(prefix) ? Number.parseInt(last.slice(prefix.length), 10) : 0
  return `${prefix}${String((Number.isFinite(n) ? n : 0) + 1).padStart(6, "0")}`
}
