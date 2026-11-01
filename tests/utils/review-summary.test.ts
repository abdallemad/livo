import { test } from "node:test"
import assert from "node:assert/strict"
import { ratingDistribution, replyBlockedReason, replyProblem } from "@/utils/review-summary"

test("distribution lists 5 → 1 stars with shares", () => {
  assert.deepEqual(ratingDistribution({ 5: 3, 4: 1 }), [
    { rating: 5, count: 3, percent: 75 },
    { rating: 4, count: 1, percent: 25 },
    { rating: 3, count: 0, percent: 0 },
    { rating: 2, count: 0, percent: 0 },
    { rating: 1, count: 0, percent: 0 },
  ])
  assert.equal(ratingDistribution({}).every((r) => r.percent === 0), true)
})

test("replies: length, and no contact details in a public reply", () => {
  assert.equal(replyProblem("Thank you, glad it worked out!"), null)
  assert.match(replyProblem(" ")!, /Write a reply/)
  assert.match(replyProblem("x".repeat(501))!, /under 500/)
  assert.match(replyProblem("Call me on 01012345678 next time")!, /public/)
  assert.match(replyProblem("mail me a@b.com")!, /public/)
})

test("hidden reviews can't be replied to", () => {
  assert.equal(replyBlockedReason(false), null)
  assert.match(replyBlockedReason(true)!, /hid/)
})
