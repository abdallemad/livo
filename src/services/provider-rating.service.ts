import "server-only"
import type { Prisma } from "@prisma/client"
import { reviewRepository as repo } from "@/repositories/review.repository"
import { isLowRated, parseLowRatingThreshold, roundRating } from "@/utils/provider-rating"

/**
 * Recomputes a provider's denormalised `ratingAvg` / `ratingCount` from their **visible** reviews and sets the BR-04
 * `underReview` flag from `SiteSetting["review.lowRatingThreshold"]`. Runs inside the caller's transaction, after the
 * review write, so the profile never disagrees with the reviews. Used by admin moderation (AD-08,
 * docs/admin-disputes-reviews-feature.md) and by the customer's own review (CU-10, docs/customer-review-feature.md).
 * A reviewee without a provider profile (a customer, SY-05) has no counters: nothing happens.
 */
export async function refreshProviderRating(revieweeId: string, tx: Prisma.TransactionClient): Promise<{ ratingAvg: number; ratingCount: number; underReview: boolean } | null> {
  if (!(await repo.findProviderProfile(revieweeId, tx))) return null
  const threshold = parseLowRatingThreshold(await repo.findSetting("review.lowRatingThreshold", tx))
  const agg = await repo.aggregateVisible(revieweeId, tx)
  const ratingAvg = roundRating(agg._avg.rating)
  const data = { ratingAvg, ratingCount: agg._count, underReview: isLowRated(ratingAvg, agg._count, threshold) }
  await repo.updateProviderRating(revieweeId, data, tx)
  return data
}
