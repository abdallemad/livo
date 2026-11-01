import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_LOW_RATING_THRESHOLD, isLowRated, parseLowRatingThreshold, roundRating } from "@/utils/provider-rating"

const t = { minBookings: 5, maxAverage: 3 }

test("a low average only counts once there are enough reviews", () => {
  assert.equal(isLowRated(2.5, 4, t), false)
  assert.equal(isLowRated(2.5, 5, t), true)
  assert.equal(isLowRated(3, 6, t), true)
  assert.equal(isLowRated(3.01, 6, t), false)
})

test("the setting falls back to the default when malformed", () => {
  assert.deepEqual(parseLowRatingThreshold({ minBookings: 10, maxAverage: 2.5 }), { minBookings: 10, maxAverage: 2.5 })
  assert.deepEqual(parseLowRatingThreshold(null), DEFAULT_LOW_RATING_THRESHOLD)
  assert.deepEqual(parseLowRatingThreshold({ minBookings: "5" }), DEFAULT_LOW_RATING_THRESHOLD)
  assert.deepEqual(parseLowRatingThreshold({ minBookings: 0, maxAverage: 3 }), DEFAULT_LOW_RATING_THRESHOLD)
})

test("ratings round to two decimals", () => {
  assert.equal(roundRating(4.666666), 4.67)
  assert.equal(roundRating(null), 0)
})
