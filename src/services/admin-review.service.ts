import "server-only"
import type { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { reviewRepository as repo, type AdminReviewRow } from "@/repositories/review.repository"
import type { ReviewListQuery, ReviewModerationValues } from "@/schemas/admin.schema"
import type { AdminReviewList, AdminReviewListItem } from "@/types/admin"
import { isLowRated, parseLowRatingThreshold, roundRating } from "@/utils/provider-rating"

/**
 * AD-08 review moderation (docs/admin-disputes-reviews-feature.md). Hiding a
 * review removes it from the provider's public rating, so the denormalised
 * `ratingAvg` / `ratingCount` and the BR-04 `underReview` flag are recomputed
 * in the same transaction. Callers must already have passed `requireAdmin()`.
 */

const toListItem = (r: AdminReviewRow): AdminReviewListItem => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  providerReply: r.providerReply,
  isHidden: r.isHidden,
  ofProvider: r.revieweeId === r.booking.providerId,
  reviewerId: r.reviewerId,
  reviewerName: r.reviewer.name || "Unknown user",
  revieweeId: r.revieweeId,
  revieweeName: r.reviewee.name || "Unknown user",
  bookingId: r.booking.id,
  bookingNumber: r.booking.number,
  createdAt: r.createdAt.toISOString(),
})

export async function listReviewsForAdmin(query: ReviewListQuery): Promise<AdminReviewList> {
  const and: Prisma.ReviewWhereInput[] = []
  if (query.visibility) and.push({ isHidden: query.visibility === "HIDDEN" })
  if (query.rating) and.push({ rating: query.rating })
  // SY-05: reviews go both ways. Prisma can't compare two columns, so "of the provider" is
  // "the reviewee has the PROVIDER role" — a user has exactly one role, so this is exact.
  if (query.direction) and.push({ reviewee: { role: query.direction === "OF_PROVIDER" ? "PROVIDER" : { not: "PROVIDER" } } })
  if (query.q) {
    and.push({
      OR: [
        { comment: { contains: query.q, mode: "insensitive" } },
        { reviewer: { name: { contains: query.q, mode: "insensitive" } } },
        { reviewee: { name: { contains: query.q, mode: "insensitive" } } },
        { booking: { number: { contains: query.q, mode: "insensitive" } } },
      ],
    })
  }
  const [[rows, total], hiddenCount] = await Promise.all([
    repo.findAdminPage({ AND: and }, (query.page - 1) * query.perPage, query.perPage),
    repo.countHidden(),
  ])
  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    hiddenCount,
  }
}

/** Hide (with a reason the reviewer sees) or show a review again; the provider's rating follows. */
export async function moderateReview(adminId: string, id: string, input: ReviewModerationValues): Promise<{ id: string; isHidden: boolean }> {
  const hide = input.action === "HIDE"
  const threshold = parseLowRatingThreshold(await repo.findSetting("review.lowRatingThreshold"))

  return repo.transaction(async (tx) => {
    const review = await repo.findForModeration(id, tx)
    if (!review) throw new NotFoundError("That review no longer exists.")
    if ((await repo.setHidden(id, hide, tx)) === 0) {
      throw new ConflictError(hide ? "This review is already hidden." : "This review is already visible.")
    }

    // Only a provider's rating is denormalised; customers have no profile counters.
    if (await repo.findProviderProfile(review.revieweeId, tx)) {
      const agg = await repo.aggregateVisible(review.revieweeId, tx)
      const ratingAvg = roundRating(agg._avg.rating)
      await repo.updateProviderRating(
        review.revieweeId,
        { ratingAvg, ratingCount: agg._count, underReview: isLowRated(ratingAvg, agg._count, threshold) },
        tx,
      )
    }

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: hide ? "review.hide" : "review.show",
        entityType: "Review",
        entityId: id,
        metadata: hide ? { reason: input.reason } : undefined,
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: review.reviewerId,
        type: "SYSTEM",
        title: hide ? `Your review on booking ${review.booking.number} was hidden` : `Your review on booking ${review.booking.number} is visible again`,
        body: hide ? input.reason : null,
        payload: { reviewId: id },
      },
      tx,
    )
    return { id, isHidden: hide }
  })
}
