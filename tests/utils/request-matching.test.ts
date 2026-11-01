import { test } from "node:test"
import assert from "node:assert/strict"
import { expandCategoryIds, requestMatchesProvider, type MatchProvider, type MatchRequest } from "@/utils/request-matching"

const now = new Date("2026-11-01T10:00:00Z")
const categories = [
  { id: "plumbing", parentId: null },
  { id: "leaks", parentId: "plumbing" },
  { id: "finishing", parentId: null },
  { id: "tiling", parentId: "finishing" },
]
const provider: MatchProvider = { verificationStatus: "APPROVED", cityId: "cairo", categoryIds: ["plumbing"], areaIds: ["maadi"] }
const cats = expandCategoryIds(provider.categoryIds, categories)
const req = (over: Partial<MatchRequest> = {}): MatchRequest => ({
  status: "OPEN",
  expiresAt: null,
  cityId: "cairo",
  categoryId: "leaks",
  areaId: "maadi",
  ...over,
})

test("categories expand to sub-categories, never to the parent", () => {
  assert.deepEqual(expandCategoryIds(["plumbing"], categories).sort(), ["leaks", "plumbing"])
  assert.deepEqual(expandCategoryIds(["tiling"], categories), ["tiling"])
})

test("an open request in my category and area matches", () => {
  assert.equal(requestMatchesProvider(req(), provider, cats, now), true)
  assert.equal(requestMatchesProvider(req({ categoryId: "plumbing" }), provider, cats, now), true)
})

test("only APPROVED providers see requests", () => {
  for (const s of ["DRAFT", "PENDING", "REJECTED", "SUSPENDED"]) {
    assert.equal(requestMatchesProvider(req(), { ...provider, verificationStatus: s }, cats, now), false, s)
  }
})

test("closed or expired requests are hidden (BR-05)", () => {
  for (const status of ["DRAFT", "ACCEPTED", "CANCELLED", "EXPIRED"]) assert.equal(requestMatchesProvider(req({ status }), provider, cats, now), false, status)
  assert.equal(requestMatchesProvider(req({ expiresAt: new Date("2026-11-01T09:59:59Z") }), provider, cats, now), false)
  assert.equal(requestMatchesProvider(req({ expiresAt: new Date("2026-11-02T00:00:00Z") }), provider, cats, now), true)
})

test("other cities and categories are hidden", () => {
  assert.equal(requestMatchesProvider(req({ cityId: "alex" }), provider, cats, now), false)
  assert.equal(requestMatchesProvider(req({ categoryId: "tiling" }), provider, cats, now), false)
})

test("area rules: my areas, whole-city requests, providers with no areas, whole-city scope", () => {
  assert.equal(requestMatchesProvider(req({ areaId: "zamalek" }), provider, cats, now), false)
  assert.equal(requestMatchesProvider(req({ areaId: null }), provider, cats, now), true)
  assert.equal(requestMatchesProvider(req({ areaId: "zamalek" }), { ...provider, areaIds: [] }, cats, now), true)
  assert.equal(requestMatchesProvider(req({ areaId: "zamalek" }), provider, cats, now, "city"), true)
})
