import { test } from "node:test"
import assert from "node:assert/strict"
import { activeFilterCount, catalogHref, categoryPageHref, durationLabel, normalizePriceRange, parsePageSegment } from "@/utils/catalog"

test("category URLs: page 1 is the clean URL, later pages use /page/N", () => {
  assert.equal(categoryPageHref("plumbing"), "/services/plumbing")
  assert.equal(categoryPageHref("plumbing", 1), "/services/plumbing")
  assert.equal(categoryPageHref("plumbing", 3), "/services/plumbing/page/3")
})

test("page segment: 1 redirects, malformed or huge 404s", () => {
  assert.equal(parsePageSegment("2"), 2)
  assert.equal(parsePageSegment("1"), "redirect")
  for (const bad of ["0", "01", "-2", "2.5", "abc", "", "1001"]) assert.equal(parsePageSegment(bad), "notFound", bad)
})

test("filters: price range is normalized, count ignores sort and page", () => {
  assert.deepEqual(normalizePriceRange(500, 100), { minPrice: 100, maxPrice: 500 })
  assert.deepEqual(normalizePriceRange(100, undefined), { minPrice: 100, maxPrice: undefined })
  assert.equal(activeFilterCount({ sort: "rating", page: 3 }), 0)
  assert.equal(activeFilterCount({ sort: "recommended", page: 1, category: "plumbing", minPrice: 0, minRating: 4 }), 3)
})

test("catalog hrefs drop defaults and keep a stable order", () => {
  assert.equal(catalogHref({ sort: "recommended", page: 1 }), "/services")
  assert.equal(catalogHref({ category: "plumbing", maxPrice: 500, sort: "price_asc", page: 2 }), "/services?category=plumbing&maxPrice=500&sort=price_asc&page=2")
  assert.equal(catalogHref({ q: "heater tap" }), "/services?q=heater+tap")
})

test("duration labels", () => {
  assert.equal(durationLabel(45), "45 min")
  assert.equal(durationLabel(60), "1 hour")
  assert.equal(durationLabel(120), "2 hours")
  assert.equal(durationLabel(90), "1.5 hours")
})

test("service URL and meta excerpts", async () => {
  const { metaExcerpt, serviceHref } = await import("@/utils/catalog")
  assert.equal(serviceHref("plumbing", "gas-heater"), "/services/plumbing/gas-heater")
  assert.equal(metaExcerpt("  Short   text\nhere "), "Short text here")
  const long = "Installing the heater and connecting water and gas, then a leak test. ".repeat(4)
  const out = metaExcerpt(long, 60)
  assert.ok(out.length <= 60, out)
  assert.ok(out.endsWith("…"))
  assert.ok(!out.includes("  "))
})
