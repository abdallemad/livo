import { test } from "node:test"
import assert from "node:assert/strict"
import { catalogQuerySchema } from "@/schemas/catalog.schema"

test("empty query = defaults (recommended, page 1, no filters)", () => {
  const q = catalogQuerySchema.parse({})
  assert.equal(q.sort, "recommended")
  assert.equal(q.page, 1)
  for (const k of ["q", "category", "area", "minPrice", "maxPrice", "maxDuration", "minRating"] as const) assert.equal(q[k], undefined, k)
})

test("URL strings are coerced; blanks are 'no filter', never 0", () => {
  const q = catalogQuerySchema.parse({ minPrice: "", maxPrice: "500", minRating: "4", maxDuration: "120", category: "Plumbing", page: "2" })
  assert.equal(q.minPrice, undefined)
  assert.equal(q.maxPrice, 500)
  assert.equal(q.minRating, 4)
  assert.equal(q.maxDuration, 120)
  assert.equal(q.category, "plumbing")
  assert.equal(q.page, 2)
})

test("bad values are rejected (the island then falls back to defaults)", () => {
  for (const bad of [{ maxDuration: "75" }, { minRating: "6" }, { category: "../etc" }, { sort: "cheapest" }, { page: "0" }, { maxPrice: "-5" }]) {
    assert.equal(catalogQuerySchema.safeParse(bad).success, false, JSON.stringify(bad))
  }
})
