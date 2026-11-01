/**
 * Calendar boundaries in Livo's operating time zone (Egypt, one city at launch — SRS A1).
 * "Today's bookings" and "earnings this month" must follow the provider's clock, not the
 * server's (UTC in Docker). Pure, and DST-safe because the offset is read from `Intl`.
 */
export const APP_TIME_ZONE = "Africa/Cairo"

const partsFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

function zonedParts(date: Date, timeZone: string) {
  const p = Object.fromEntries(partsFormatter(timeZone).formatToParts(date).map((x) => [x.type, x.value]))
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), hour: Number(p.hour), minute: Number(p.minute), second: Number(p.second) }
}

/** Milliseconds the zone is ahead of UTC at `date`. */
function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** The UTC instant of local midnight on y-m-d in `timeZone` (day may overflow, like `Date.UTC`). */
function zonedMidnight(year: number, month: number, day: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day)
  const first = guess - offsetMs(new Date(guess), timeZone)
  const second = guess - offsetMs(new Date(first), timeZone)
  return new Date(second)
}

/** `[start, end)` of the local day containing `now`. */
export function zonedDayRange(now: Date, timeZone: string = APP_TIME_ZONE) {
  const { year, month, day } = zonedParts(now, timeZone)
  return { start: zonedMidnight(year, month, day, timeZone), end: zonedMidnight(year, month, day + 1, timeZone) }
}

/** `[start, end)` of the local month containing `now`. */
export function zonedMonthRange(now: Date, timeZone: string = APP_TIME_ZONE) {
  const { year, month } = zonedParts(now, timeZone)
  return { start: zonedMidnight(year, month, 1, timeZone), end: zonedMidnight(year, month + 1, 1, timeZone) }
}

/** Whole local days from `now` to `date` (negative = in the past). Same local day → 0. */
export function zonedDaysBetween(now: Date, date: Date, timeZone: string = APP_TIME_ZONE) {
  const a = zonedDayRange(now, timeZone).start.getTime()
  const b = zonedDayRange(date, timeZone).start.getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * Formatters pinned to Livo's time zone: appointment times must read the same on the server render
 * (UTC) and in any browser, and match the customer's clock.
 */
const zonedFormatters = {
  time: new Intl.DateTimeFormat("en-EG", { numberingSystem: "latn", timeStyle: "short", timeZone: APP_TIME_ZONE }),
  date: new Intl.DateTimeFormat("en-EG", { numberingSystem: "latn", weekday: "short", day: "numeric", month: "short", timeZone: APP_TIME_ZONE }),
  dateTime: new Intl.DateTimeFormat("en-EG", { numberingSystem: "latn", dateStyle: "medium", timeStyle: "short", timeZone: APP_TIME_ZONE }),
}
export const formatZonedTime = (v: Date | string) => zonedFormatters.time.format(new Date(v))
/** "Sun, 1 Nov" — for appointment days. */
export const formatZonedDay = (v: Date | string) => zonedFormatters.date.format(new Date(v))
export const formatZonedDateTime = (v: Date | string) => zonedFormatters.dateTime.format(new Date(v))

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: APP_TIME_ZONE })

/** Local weekday (0 = Sunday … 6 = Saturday, like `Availability.weekday`) and minutes since local midnight. */
export function zonedWeekdayMinutes(date: Date, timeZone: string = APP_TIME_ZONE) {
  const p = zonedParts(date, timeZone)
  const weekday = timeZone === APP_TIME_ZONE ? weekdayFormat.format(date) : new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(date)
  return { weekday: WEEKDAY_INDEX[weekday], minutes: p.hour * 60 + p.minute }
}

/** "YYYY-MM-DD" of the local day containing `date` (a date input's value). */
export function zonedIsoDay(date: Date, timeZone: string = APP_TIME_ZONE) {
  const { year, month, day } = zonedParts(date, timeZone)
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** UTC instant of local midnight for a "YYYY-MM-DD" day. */
export function zonedDayStart(isoDay: string, timeZone: string = APP_TIME_ZONE) {
  const [y, m, d] = isoDay.split("-").map(Number)
  return zonedMidnight(y, m, d, timeZone)
}
