import {
  MIN_COMPLETED_JOBS_TO_SHOW,
  MIN_FEATURED_PROVIDERS,
  MIN_GALLERY_IMAGES,
  MIN_PROVIDER_REVIEWS_FOR_STARS,
  MIN_PROVIDERS_TO_SHOW,
  MIN_REVIEWS_TO_SHOW,
} from "@/constants/trust"

/**
 * Social-proof threshold logic (docs/landing-page.md) — pure and tested. A number is shown only when it's real and
 * above its threshold in `constants/trust.ts`; below it the landing page shows the launch message instead.
 */

export interface PlatformStats {
  reviewsCount: number
  /** Average of visible reviews; ignored unless `reviewsCount` passes its threshold. */
  averageRating: number | null
  approvedProviders: number
  completedJobs: number
}

export type ProofItem = { kind: "rating"; value: number; count: number } | { kind: "providers"; value: number } | { kind: "jobs"; value: number }

export interface ProofThresholds {
  minReviews: number
  minProviders: number
  minJobs: number
}

const DEFAULTS: ProofThresholds = { minReviews: MIN_REVIEWS_TO_SHOW, minProviders: MIN_PROVIDERS_TO_SHOW, minJobs: MIN_COMPLETED_JOBS_TO_SHOW }

export function visibleProof(stats: PlatformStats, t: ProofThresholds = DEFAULTS): ProofItem[] {
  const out: ProofItem[] = []
  if (stats.reviewsCount >= t.minReviews && stats.averageRating !== null) {
    out.push({ kind: "rating", value: Math.round(stats.averageRating * 10) / 10, count: stats.reviewsCount })
  }
  if (stats.approvedProviders >= t.minProviders) out.push({ kind: "providers", value: stats.approvedProviders })
  if (stats.completedJobs >= t.minJobs) out.push({ kind: "jobs", value: stats.completedJobs })
  return out
}

/** Show a provider's stars only with enough reviews; a 5.0 from one review isn't a signal. */
export const showProviderStars = (reviewsCount: number, min = MIN_PROVIDER_REVIEWS_FOR_STARS) => reviewsCount >= min

export const showFeaturedProviders = (count: number, min = MIN_FEATURED_PROVIDERS) => count >= min

export const showGallery = (count: number, min = MIN_GALLERY_IMAGES) => count >= min
