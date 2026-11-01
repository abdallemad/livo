import type { CategoryType } from "@prisma/client"
import { maskContactDetails } from "./contact-mask"

/**
 * Creating a quote request (CU-03, Flow 2, BR-05, SY-04; docs/customer-new-request-feature.md) — pure and tested.
 */

export const REQUEST_TITLE_MIN = 5
export const REQUEST_TITLE_MAX = 80
export const REQUEST_DESCRIPTION_MIN = 20
export const REQUEST_DESCRIPTION_MAX = 2000
export const REQUEST_MAX_PHOTOS = 6
export const REQUEST_BUDGET_MIN = 50
export const REQUEST_BUDGET_MAX = 5_000_000
export const REQUEST_SIZE_MAX = 100_000
/** How far ahead a preferred date may be. */
export const PREFERRED_DATE_MAX_DAYS = 120
export const DEFAULT_EXPIRY_DAYS = 7

/** Quote requests exist for categories priced by quote (SRS 2.2); fixed-price-only categories are booked directly. */
export const takesQuotes = (type: CategoryType) => type === "QUOTE" || type === "BOTH"

/**
 * The approximate size (Flow 2: "مساحة تقريبية") has no column, so it's kept as the description's first line where
 * every provider reads it. Blank / zero = no line.
 */
export function composeDescription(description: string, sizeM2?: number | null) {
  const body = description.trim()
  return sizeM2 && sizeM2 > 0 ? `Approximate size: ${sizeM2} m²\n\n${body}` : body
}

/** SY-04: providers read the title and description before any booking, so phone numbers / emails / chat links are refused. */
export function contactProblem(text: string): string | null {
  return maskContactDetails(text).masked ? "Don't include phone numbers, emails or chat links — you'll get the provider's contact once you book." : null
}

/** `SiteSetting["request.expiryDays"]` (BR-05): 1–60 days, 7 if missing or invalid. */
export function expiryDays(value: unknown) {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 60 ? n : DEFAULT_EXPIRY_DAYS
}

export const requestExpiresAt = (now: Date, days: number) => new Date(now.getTime() + days * 86_400_000)

/** A preferred date ("YYYY-MM-DD", the customer's local day) must be today or later, and not too far ahead. */
export function preferredDateProblem(isoDay: string, todayIsoDay: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay) || Number.isNaN(Date.parse(`${isoDay}T00:00:00Z`))) return "Choose a valid date."
  if (isoDay < todayIsoDay) return "Choose today or a later date."
  const days = (Date.parse(`${isoDay}T00:00:00Z`) - Date.parse(`${todayIsoDay}T00:00:00Z`)) / 86_400_000
  return days > PREFERRED_DATE_MAX_DAYS ? `Choose a date within the next ${PREFERRED_DATE_MAX_DAYS} days.` : null
}
