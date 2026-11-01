import { test } from "node:test"
import assert from "node:assert/strict"
import { showFeaturedProviders, showGallery, showProviderStars, visibleProof } from "@/utils/trust"

const t = { minReviews: 20, minProviders: 10, minJobs: 50 }

test("at launch, nothing is shown — no number below its threshold", () => {
  assert.deepEqual(visibleProof({ reviewsCount: 19, averageRating: 4.9, approvedProviders: 9, completedJobs: 49 }, t), [])
})

test("each number appears once it passes its own threshold", () => {
  assert.deepEqual(visibleProof({ reviewsCount: 20, averageRating: 4.66, approvedProviders: 9, completedJobs: 50 }, t), [
    { kind: "rating", value: 4.7, count: 20 },
    { kind: "jobs", value: 50 },
  ])
  assert.deepEqual(visibleProof({ reviewsCount: 0, averageRating: null, approvedProviders: 12, completedJobs: 0 }, t), [{ kind: "providers", value: 12 }])
})

test("a rating needs an average as well as enough reviews", () => {
  assert.deepEqual(visibleProof({ reviewsCount: 30, averageRating: null, approvedProviders: 0, completedJobs: 0 }, t), [])
})

test("per-provider stars, featured providers and the gallery have their own minimums", () => {
  assert.equal(showProviderStars(4, 5), false)
  assert.equal(showProviderStars(5, 5), true)
  assert.equal(showFeaturedProviders(2, 3), false)
  assert.equal(showFeaturedProviders(3, 3), true)
  assert.equal(showGallery(2, 3), false)
})

test("the default thresholds come from constants/trust.ts", async () => {
  const { MIN_REVIEWS_TO_SHOW, MIN_PROVIDERS_TO_SHOW } = await import("@/constants/trust")
  assert.equal(MIN_REVIEWS_TO_SHOW, 20)
  assert.equal(MIN_PROVIDERS_TO_SHOW, 10)
  assert.deepEqual(visibleProof({ reviewsCount: 19, averageRating: 5, approvedProviders: 10, completedJobs: 0 }), [{ kind: "providers", value: 10 }])
})
