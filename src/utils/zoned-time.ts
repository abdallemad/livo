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
