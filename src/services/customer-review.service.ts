import "server-only"
import { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { customerReviewRepository as repo, type CustomerReviewBookingRow, type CustomerReviewRow } from "@/repositories/customer-review.repository"
import type { CustomerReviewValues } from "@/schemas/customer-review.schema"
import { pushStoredNotifications, type StoredNotification } from "@/services/notification.service"
import { refreshProviderRating } from "@/services/provider-rating.service"
import type { CustomerBookingReview, CustomerReviewDto, CustomerReviewSaveDto } from "@/types/customer-review"
import { REVIEW_EDIT_DAYS, reviewBlockedReason, reviewEditableUntil, reviewEditBlockedReason, reviewNotificationBody } from "@/utils/customer-review"

/**
 * The customer rates a finished booking (CU-10, BR-03, SY-05) — `/account/bookings/[id]/review`,
 * docs/customer-review-feature.md. The customer id always comes from the session; someone else's booking is a 404.
 *
 * One write = one transaction: the review (created, or edited inside the {@link REVIEW_EDIT_DAYS}-day window), the
 * provider's denormalised rating + BR-04 flag (`refreshProviderRating`, the same code admin moderation uses), an audit
 * entry and the provider's `REVIEW_RECEIVED` notification. The route then revalidates the storefront, because the
 * rating and the review show on the public provider and service pages.
 */

const titleOf = (b: CustomerReviewBookingRow) => b.service?.title ?? b.request?.title ?? "Booking"

function toReviewDto(r: CustomerReviewRow, now: Date): CustomerReviewDto {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    providerReply: r.providerReply,
    isHidden: r.isHidden,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    // `@updatedAt` is stamped a few ms after `createdAt` on insert, so "edited" means a real gap.
    edited: r.updatedAt.getTime() - r.createdAt.getTime() > 1000,
    editBlockedReason: reviewEditBlockedReason({ createdAt: r.createdAt, isHidden: r.isHidden, hasReply: r.providerReply !== null }, now),
    editableUntil: reviewEditableUntil(r.createdAt).toISOString(),
  }
}

/** `GET /api/me/bookings/[id]/review` and the page's first snapshot; `null` → 404 (unknown or someone else's booking). */
export async function getMyBookingReview(customerId: string, bookingId: string): Promise<CustomerBookingReview | null> {
  const [b, review] = await Promise.all([repo.findBooking(bookingId, customerId), repo.findReview(bookingId, customerId)])
  if (!b) return null
  const now = new Date()
  return {
    booking: { id: b.id, number: b.number, title: titleOf(b), status: b.status, completedAt: b.completedAt?.toISOString() ?? null },
    provider: { id: b.providerId, name: b.provider.user.name || "Your provider", avatarUrl: b.provider.user.avatarUrl },
    // An existing review is shown whatever the booking's status became since (e.g. a dispute opened afterwards).
    blockedReason: review ? null : reviewBlockedReason(b.status),
    review: review ? toReviewDto(review, now) : null,
  }
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"

/** `PUT /api/me/bookings/[id]/review` — rate the booking, or edit the rating while that's still allowed. */
export async function saveMyBookingReview(customerId: string, bookingId: string, input: CustomerReviewValues): Promise<CustomerReviewSaveDto> {
  const now = new Date()
  let result: { dto: CustomerReviewSaveDto; notification: StoredNotification }
  try {
    result = await repo.transaction(async (tx) => {
      const b = await repo.findBooking(bookingId, customerId, tx)
      if (!b) throw new NotFoundError("That booking doesn't exist.")
      const existing = await repo.findReview(bookingId, customerId, tx)

      let saved: CustomerReviewRow
      if (existing) {
        const blocked = reviewEditBlockedReason({ createdAt: existing.createdAt, isHidden: existing.isHidden, hasReply: existing.providerReply !== null }, now)
        if (blocked) throw new ConflictError(blocked)
        const since = new Date(now.getTime() - REVIEW_EDIT_DAYS * 24 * 60 * 60 * 1000)
        if ((await repo.updateEditable(existing.id, customerId, since, { rating: input.rating, comment: input.comment }, tx)) === 0) {
          throw new ConflictError("Your review just changed (the provider may have replied). Reload to see the latest.")
        }
        saved = (await repo.findReview(bookingId, customerId, tx))!
      } else {
        const blocked = reviewBlockedReason(b.status)
        if (blocked) throw new ConflictError(blocked)
        saved = await repo.create({ bookingId, reviewerId: customerId, revieweeId: b.providerId, rating: input.rating, comment: input.comment }, tx)
      }

      await refreshProviderRating(b.providerId, tx)
      await auditRepository.createAuditLog(
        {
          actorId: customerId,
          action: existing ? "review.update" : "review.create",
          entityType: "Review",
          entityId: saved.id,
          metadata: { bookingId, rating: input.rating, ...(existing ? { previousRating: existing.rating } : {}) },
        },
        tx,
      )

      const notification: StoredNotification = {
        userId: b.providerId,
        type: "REVIEW_RECEIVED",
        title: existing ? `The customer updated their review of ${b.number}` : `New review on booking ${b.number}`,
        body: reviewNotificationBody(input.rating, input.comment),
        payload: { bookingId, reviewId: saved.id },
      }
      await auditRepository.createNotification({ ...notification, payload: { bookingId, reviewId: saved.id } }, tx)

      return { dto: { review: toReviewDto(saved, now), created: !existing }, notification }
    })
  } catch (error) {
    // Two tabs submitting the first review at once: the DB unique (bookingId, reviewerId) lets only one in.
    if (isUniqueViolation(error)) throw new ConflictError("You already rated this booking. Reload to see your review.")
    throw error
  }

  // After the commit: the provider's bell + a live toast (docs/notifications-feature.md).
  await pushStoredNotifications([result.notification])
  return result.dto
}
