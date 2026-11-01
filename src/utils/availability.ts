/**
 * Weekly working hours (PR-10, docs/provider-schedule-reviews-feature.md) — pure and tested.
 * Stored as `Availability` rows: `weekday` 0 = Sunday … 6 = Saturday, `startTime` / `endTime`
 * "HH:MM" in Cairo local time. The Egyptian week starts on Saturday, so screens list Sat → Fri.
 * Times are on a 30-minute grid; "24:00" means end of day. No overnight ranges.
 */

export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5] as const
export const WEEKDAY_LABEL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const
export const MAX_RANGES_PER_DAY = 3
export const TIME_STEP_MINUTES = 30

export interface TimeRange {
  start: string
  end: string
}

export interface DayHours {
  weekday: number
  ranges: TimeRange[]
}

const TIME_RE = /^([01]\d|2[0-4]):([0-5]\d)$/

export function toMinutes(time: string): number | null {
  const m = TIME_RE.exec(time)
  if (!m) return null
  const minutes = Number(m[1]) * 60 + Number(m[2])
  return minutes > 24 * 60 ? null : minutes
}

export const fromMinutes = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

/** "00:00", "00:30" … "24:00" — the choices in the editor. */
export const TIME_OPTIONS = Array.from({ length: (24 * 60) / TIME_STEP_MINUTES + 1 }, (_, i) => fromMinutes(i * TIME_STEP_MINUTES))

/** "09:00" → "9:00 AM"-style label without locale surprises; "24:00" → "Midnight". */
export function timeLabel(time: string): string {
  const m = toMinutes(time)
  if (m === null) return time
  if (m === 24 * 60 || m === 0) return "Midnight"
  if (m === 12 * 60) return "Noon"
  const h = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, "0")
  return `${h % 12 || 12}:${mm} ${h < 12 ? "AM" : "PM"}`
}

/** `null` when the day is valid, otherwise the sentence to show next to it. */
export function dayError(ranges: TimeRange[]): string | null {
  if (ranges.length > MAX_RANGES_PER_DAY) return `At most ${MAX_RANGES_PER_DAY} time ranges a day.`
  const parsed = ranges.map((r) => ({ start: toMinutes(r.start), end: toMinutes(r.end) }))
  for (const p of parsed) {
    if (p.start === null || p.end === null) return "Choose a start and an end time."
    if (p.start % TIME_STEP_MINUTES || p.end % TIME_STEP_MINUTES) return "Use whole or half hours."
    if (p.start >= p.end) return "The end time must be after the start time."
  }
  const sorted = [...parsed].sort((a, b) => a.start! - b.start!)
  for (let i = 1; i < sorted.length; i++) if (sorted[i].start! < sorted[i - 1].end!) return "Time ranges overlap."
  return null
}

/** Sorted ranges per weekday, every weekday present (days off have no ranges). */
export function normalizeWeek(days: DayHours[]): DayHours[] {
  const byDay = new Map<number, TimeRange[]>()
  for (const d of days) byDay.set(d.weekday, [...(byDay.get(d.weekday) ?? []), ...d.ranges])
  return WEEK_ORDER.map((weekday) => ({
    weekday,
    ranges: [...(byDay.get(weekday) ?? [])].sort((a, b) => toMinutes(a.start)! - toMinutes(b.start)!),
  }))
}

export function weeklyMinutes(days: DayHours[]): number {
  return days.reduce((sum, d) => sum + d.ranges.reduce((s, r) => s + (toMinutes(r.end)! - toMinutes(r.start)!), 0), 0)
}

/**
 * Is a booking at this local weekday + minute inside the working hours? `null` when no hours are
 * set at all (nothing to compare with).
 */
export function isWithinHours(days: DayHours[], weekday: number, minutes: number): boolean | null {
  if (days.every((d) => d.ranges.length === 0)) return null
  const ranges = days.find((d) => d.weekday === weekday)?.ranges ?? []
  return ranges.some((r) => minutes >= toMinutes(r.start)! && minutes < toMinutes(r.end)!)
}

/** The one-tap preset: Saturday to Thursday, 9 to 6, Friday off (the seed's default too). */
export const DEFAULT_WEEK: DayHours[] = WEEK_ORDER.map((weekday) => ({ weekday, ranges: weekday === 5 ? [] : [{ start: "09:00", end: "18:00" }] }))
