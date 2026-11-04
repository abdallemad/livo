import type { BookingStatus } from "@prisma/client"
import { maskContactDetails } from "@/utils/contact-mask"

/**
 * The customer's review of a finished booking (CU-10, BR-03, SY-05; docs/customer-review-feature.md) — pure, shared by
 * the form, the API schema and the service, and unit tested.
 *
 * - A booking can be rated once it's finished (`COMPLETED` / `CLOSED`, BR-03), once per customer (DB unique
 *   `bookingId + reviewerId`).
 * - The review can be edited for {@link REVIEW_EDIT_DAYS} days, unless the provider already replied (the reply would
 *   lose its context) or Livo hid it (AD-08).
 * - The comment is optional, but it's public (provider profile, service page), so phone numbers, emails and chat links
 *   are refused — the same rule as the provider's reply (SY-04, risk R1).
 */

export const REVIEW_COMMENT_MAX = 1000
export const REVIEW_EDIT_DAYS = 7

export const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"] as const

const DONE: BookingStatus[] = ["COMPLETED", "CLOSED"]

/** Why the comment can't be posted, or `null`. Empty is fine (stars only). */
export function reviewCommentProblem(text: string): string | null {
  const t = text.trim()
  if (t.length > REVIEW_COMMENT_MAX) return `Keep your review under ${REVIEW_COMMENT_MAX} characters.`
  if (t && maskContactDetails(t).masked) return "Reviews are public: don't include phone numbers, emails or chat links."
  return null
}

/** Why this booking can't be rated (yet), or `null`. Answered as a 409 by the API, shown as a banner by the page. */
export function reviewBlockedReason(status: BookingStatus): string | null {
  if (DONE.includes(status)) return null
  if (status === "CANCELLED" || status === "REJECTED") return "This booking was cancelled, so there's nothing to rate."
  if (status === "DISPUTED") return "This booking has an open dispute. You can rate it once it's settled and the job is closed."
  return "You can rate the service once the job is done and you've confirmed it."
}

/** The last moment the review can be edited. */
export const reviewEditableUntil = (createdAt: Date) => new Date(createdAt.getTime() + REVIEW_EDIT_DAYS * 24 * 60 * 60 * 1000)

/** Why an existing review can't be changed any more, or `null`. */
export function reviewEditBlockedReason(review: { createdAt: Date; isHidden: boolean; hasReply: boolean }, now: Date): string | null {
  if (review.isHidden) return "Livo hid this review because it broke the review rules, so it can't be edited."
  if (review.hasReply) return "The provider already replied to your review, so it can't be changed any more."
  if (now.getTime() > reviewEditableUntil(review.createdAt).getTime()) return `Reviews can only be changed within ${REVIEW_EDIT_DAYS} days.`
  return null
}

/** One-line body of the provider's notification: "5 stars — “Great job…”". */
export function reviewNotificationBody(rating: number, comment: string | null): string {
  const stars = `${rating} star${rating === 1 ? "" : "s"}`
  if (!comment) return `${stars}.`
  const short = comment.length > 120 ? `${comment.slice(0, 117).trimEnd()}…` : comment
  return `${stars} — “${short}”`
}
