import "server-only"
import type { BookingStatus } from "@prisma/client"
import { NotFoundError } from "@/lib/errors"
import { providerScheduleRepository as repo } from "@/repositories/provider-schedule.repository"
import type { ScheduleValues } from "@/schemas/provider-schedule.schema"
import type { ProviderSchedule, ScheduleDay } from "@/types/provider-schedule"
import { isWithinHours, normalizeWeek, weeklyMinutes, type DayHours } from "@/utils/availability"
import { bookingPlace } from "@/utils/provider-booking"
import { zonedDayRange, zonedWeekdayMinutes } from "@/utils/zoned-time"

/**
 * The provider's weekly working hours and the next two weeks of bookings against them
 * (PR-10, docs/provider-schedule-reviews-feature.md). Hours are Cairo local time. The provider id
 * always comes from the session.
 */

const UPCOMING_DAYS = 14
const SCHEDULED: BookingStatus[] = ["PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"]

const toWeek = (rows: { weekday: number; startTime: string; endTime: string }[]): DayHours[] =>
  normalizeWeek(rows.map((r) => ({ weekday: r.weekday, ranges: [{ start: r.startTime, end: r.endTime }] })))

export async function getSchedule(providerId: string, now = new Date()): Promise<ProviderSchedule> {
  const today = zonedDayRange(now).start
  // Local midnights for the next 14 days (DST-safe: each is the start of the day containing +12h).
  const starts: Date[] = []
  let cursor = today
  for (let i = 0; i < UPCOMING_DAYS; i++) {
    starts.push(cursor)
    cursor = zonedDayRange(new Date(cursor.getTime() + 36 * 3_600_000)).start
  }
  const [rows, bookings] = await Promise.all([repo.findAvailability(providerId), repo.findBookingsBetween(providerId, today, cursor, SCHEDULED)])
  const week = toWeek(rows)

  const upcoming: ScheduleDay[] = starts.map((start, i) => {
    const end = starts[i + 1] ?? cursor
    const { weekday } = zonedWeekdayMinutes(new Date(start.getTime() + 12 * 3_600_000))
    return {
      date: start.toISOString(),
      weekday,
      ranges: week.find((d) => d.weekday === weekday)?.ranges ?? [],
      bookings: bookings
        .filter((b) => b.scheduledAt! >= start && b.scheduledAt! < end)
        .map((b) => {
          const local = zonedWeekdayMinutes(b.scheduledAt!)
          return {
            id: b.id,
            number: b.number,
            title: b.service?.title ?? b.request?.title ?? "Booking",
            status: b.status,
            scheduledAt: b.scheduledAt!.toISOString(),
            place: bookingPlace(b.addressSnapshot, b.contactUnlockedAt !== null),
            withinHours: isWithinHours(week, local.weekday, local.minutes),
          }
        }),
    }
  })

  return { week, weeklyMinutes: weeklyMinutes(week), upcoming }
}

/** Replace the whole week. Validation (grid, order, overlaps) already ran in the schema. */
export async function saveSchedule(providerId: string, values: ScheduleValues): Promise<{ weeklyMinutes: number }> {
  if (!(await repo.hasProfile(providerId))) throw new NotFoundError("This account has no provider profile.")
  const week = normalizeWeek(values.days)
  const rows = week.flatMap((d) => d.ranges.map((r) => ({ weekday: d.weekday, startTime: r.start, endTime: r.end })))
  await repo.transaction((tx) => repo.replaceAvailability(providerId, rows, tx))
  return { weeklyMinutes: weeklyMinutes(week) }
}
