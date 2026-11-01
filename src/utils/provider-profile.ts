import { timeLabel, WEEK_ORDER, WEEKDAY_LABEL } from "./availability"

/**
 * The public provider profile (`/providers/[id]`, PR-04, PR-10, SY-04; docs/provider-profile-feature.md) — pure, tested.
 */

export interface PublicDayHours {
  day: string
  /** "9:00 AM – 6:00 PM" ranges; empty = closed that day. */
  ranges: string[]
}

/**
 * Working hours Sat → Fri (the Egyptian week). A provider who never set hours gets `null` (nothing is shown, rather
 * than a week of "Closed" that would be untrue).
 */
export function publicWeek(rows: { weekday: number; startTime: string; endTime: string }[]): PublicDayHours[] | null {
  if (!rows.length) return null
  return WEEK_ORDER.map((weekday) => ({
    day: WEEKDAY_LABEL[weekday],
    ranges: rows
      .filter((r) => r.weekday === weekday)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((r) => `${timeLabel(r.startTime)} – ${timeLabel(r.endTime)}`),
  }))
}

/** "Painting, Plumbing and 2 more" — a short specialties phrase for titles and meta descriptions. */
export function specialtiesPhrase(names: string[], max = 2): string {
  if (!names.length) return ""
  if (names.length <= max) return names.join(names.length === 2 ? " and " : ", ")
  return `${names.slice(0, max).join(", ")} and ${names.length - max} more`
}

/** The meta description: who, what, where, and the track record — facts only, nothing invented. */
export function profileMetaDescription(p: { name: string; specialties: string[]; city: string; completedJobs: number; yearsExperience: number | null }): string {
  const what = specialtiesPhrase(p.specialties)
  const facts = [
    p.yearsExperience ? `${p.yearsExperience} years of experience` : null,
    p.completedJobs ? `${p.completedJobs} ${p.completedJobs === 1 ? "job" : "jobs"} done on Livo` : null,
  ].filter(Boolean)
  return [`${p.name} is a verified${what ? ` ${what}` : ""} provider in ${p.city}.`, facts.length ? `${facts.join(", ")}.` : null, "See services, past work and reviews, and book or request a quote."]
    .filter(Boolean)
    .join(" ")
}
