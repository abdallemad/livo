import { test } from "node:test"
import assert from "node:assert/strict"
import { customerReviewSchema } from "@/schemas/customer-review.schema"
import {
  REVIEW_COMMENT_MAX,
  REVIEW_EDIT_DAYS,
  reviewBlockedReason,
  reviewCommentProblem,
  reviewEditableUntil,
  reviewEditBlockedReason,
  reviewNotificationBody,
} from "@/utils/customer-review"

const DAY = 24 * 60 * 60 * 1000

test("only finished bookings can be rated (BR-03)", () => {
  assert.equal(reviewBlockedReason("COMPLETED"), null)
  assert.equal(reviewBlockedReason("CLOSED"), null)
  for (const s of ["PENDING_PAYMENT", "PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"] as const) {
    assert.match(reviewBlockedReason(s)!, /once the job is done/)
  }
  assert.match(reviewBlockedReason("CANCELLED")!, /cancelled/)
  assert.match(reviewBlockedReason("REJECTED")!, /cancelled/)
  assert.match(reviewBlockedReason("DISPUTED")!, /dispute/)
})

test("comments are optional, capped, and can't carry contact details", () => {
  assert.equal(reviewCommentProblem(""), null)
  assert.equal(reviewCommentProblem("   "), null)
  assert.equal(reviewCommentProblem("On time and tidy."), null)
  assert.match(reviewCommentProblem("x".repeat(REVIEW_COMMENT_MAX + 1))!, /under/)
  assert.match(reviewCommentProblem("Call me on 01012345678")!, /public/)
  assert.match(reviewCommentProblem("mail paul@example.com")!, /public/)
  assert.match(reviewCommentProblem("wa.me/123")!, /public/)
})

test("a review can be edited for a week, unless replied to or hidden", () => {
  const created = new Date("2026-11-01T10:00:00Z")
  const base = { createdAt: created, isHidden: false, hasReply: false }
  assert.equal(reviewEditableUntil(created).getTime(), created.getTime() + REVIEW_EDIT_DAYS * DAY)
  assert.equal(reviewEditBlockedReason(base, new Date(created.getTime() + DAY)), null)
  assert.equal(reviewEditBlockedReason(base, reviewEditableUntil(created)), null)
  assert.match(reviewEditBlockedReason(base, new Date(created.getTime() + REVIEW_EDIT_DAYS * DAY + 1))!, /within 7 days/)
  assert.match(reviewEditBlockedReason({ ...base, hasReply: true }, created)!, /replied/)
  assert.match(reviewEditBlockedReason({ ...base, isHidden: true }, created)!, /hid/)
})

test("schema: rating 1..5 required, comment trimmed and empty → null", () => {
  assert.deepEqual(customerReviewSchema.parse({ rating: 4, comment: "  Great  " }), { rating: 4, comment: "Great" })
  assert.deepEqual(customerReviewSchema.parse({ rating: 5, comment: "" }), { rating: 5, comment: null })
  assert.deepEqual(customerReviewSchema.parse({ rating: 1 }), { rating: 1, comment: null })
  for (const rating of [0, 6, 3.5, "4", undefined]) {
    const r = customerReviewSchema.safeParse({ rating })
    assert.equal(r.success, false, `rating ${String(rating)} should fail`)
    assert.equal(r.error!.issues[0]!.message, "Choose a star rating.")
  }
  const leak = customerReviewSchema.safeParse({ rating: 5, comment: "text me +352 621 123 456" })
  assert.equal(leak.success, false)
  assert.deepEqual(leak.error!.issues[0]!.path, ["comment"])
})

test("provider notification body", () => {
  assert.equal(reviewNotificationBody(1, null), "1 star.")
  assert.equal(reviewNotificationBody(5, "Great job"), "5 stars — “Great job”")
  const long = reviewNotificationBody(4, "a".repeat(200))
  assert.ok(long.length < 140 && long.endsWith("…”"))
})
