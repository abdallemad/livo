/**
 * BR-04: a provider whose average rating is at or below a threshold, once they
 * have enough reviews, goes "under review". The threshold lives in
 * `SiteSetting["review.lowRatingThreshold"]` so it can change without a deploy.
 * Pure and tested (docs/admin-disputes-reviews-feature.md).
 */
export interface LowRatingThreshold {
  minBookings: number
  maxAverage: number
}

export const DEFAULT_LOW_RATING_THRESHOLD: LowRatingThreshold = { minBookings: 5, maxAverage: 3 }

/** Reads the setting's JSON; anything malformed falls back to the default. */
export function parseLowRatingThreshold(value: unknown): LowRatingThreshold {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>
    if (typeof v.minBookings === "number" && typeof v.maxAverage === "number" && v.minBookings > 0) {
      return { minBookings: v.minBookings, maxAverage: v.maxAverage }
    }
  }
  return DEFAULT_LOW_RATING_THRESHOLD
}

export function isLowRated(average: number, count: number, threshold: LowRatingThreshold): boolean {
  return count >= threshold.minBookings && average <= threshold.maxAverage
}

/** Average rounded to 2 decimals, as stored in `ProviderProfile.ratingAvg` (Decimal(3,2)). */
export const roundRating = (average: number | null) => Math.round((average ?? 0) * 100) / 100
