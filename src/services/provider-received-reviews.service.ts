import "server-only"
import type { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { providerScheduleRepository as repo } from "@/repositories/provider-schedule.repository"
import type { ProviderReviewListQuery } from "@/schemas/provider-schedule.schema"
import type { ProviderReviewList } from "@/types/provider-schedule"
import { firstName } from "@/utils/provider-booking"
import { ratingDistribution, replyBlockedReason } from "@/utils/review-summary"

/**
 * Reviews customers left for the signed-in provider (PR-13, SY-05, docs/provider-schedule-reviews-feature.md):
 * the list, a rating summary (visible reviews only, as in the stored average — AD-08), and replying.
 * (Not to be confused with `provider-review.service.ts`, the admin's verification review.)
 */

export async function listReceivedReviews(providerId: string, query: ProviderReviewListQuery): Promise<ProviderReviewList> {
  const profile = await repo.hasProfile(providerId)
  const mine: Prisma.ReviewWhereInput = { revieweeId: providerId }
  const visibleUnreplied: Prisma.ReviewWhereInput = { ...mine, isHidden: false, providerReply: null }
  const replied: Prisma.ReviewWhereInput = { ...mine, providerReply: { not: null } }
  const where: Prisma.ReviewWhereInput = {
    ...(query.filter === "unreplied" ? visibleUnreplied : query.filter === "replied" ? replied : mine),
    ...(query.rating ? { rating: query.rating } : {}),
  }

  const [[rows, total], byRating, unreplied, repliedCount, hidden] = await Promise.all([
    repo.findReviewPage(where, (query.page - 1) * query.perPage, query.perPage),
    repo.countVisibleByRating(providerId),
    repo.countReviews(visibleUnreplied),
    repo.countReviews(replied),
    repo.countReviews({ ...mine, isHidden: true }),
  ])
  const counts = Object.fromEntries(byRating.map((g) => [g.rating, g._count._all]))

  return {
    items: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reply: r.providerReply,
      isHidden: r.isHidden,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      customerFirstName: firstName(r.reviewer.name),
      booking: { id: r.booking.id, number: r.booking.number, title: r.booking.service?.title ?? r.booking.request?.title ?? "Booking" },
      replyBlockedReason: replyBlockedReason(r.isHidden),
    })),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    summary: {
      average: profile ? Number(profile.ratingAvg.toString()) : 0,
      count: profile?.ratingCount ?? 0,
      distribution: ratingDistribution(counts),
      unreplied,
      replied: repliedCount,
      hidden,
      underReview: profile?.underReview ?? false,
    },
  }
}

/** Add, edit (`reply`) or remove (`null`) the public reply. Conditional on "mine and not hidden". */
export async function setReviewReply(providerId: string, id: string, reply: string | null): Promise<{ id: string; reply: string | null }> {
  if ((await repo.setReply(id, providerId, reply)) === 0) {
    const review = await repo.findOwnReview(id, providerId)
    if (!review) throw new NotFoundError("That review doesn't exist.")
    throw new ConflictError(replyBlockedReason(review.isHidden) ?? "This review just changed. Reload to see the latest.")
  }
  return { id, reply }
}
