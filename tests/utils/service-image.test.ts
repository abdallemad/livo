import { test } from "node:test"
import assert from "node:assert/strict"
import { cardSummary, externalCoverUrl, serviceCoverUrl, serviceGalleryUrls } from "@/utils/service-image"

test("uploads win over the stock cover", () => {
  assert.equal(serviceCoverUrl(["f1", "f2"], "https://picsum.photos/seed/x/800/600"), "/api/images/services/f1")
  assert.deepEqual(serviceGalleryUrls(["f1", "f2"], "https://picsum.photos/seed/x/800/600"), ["/api/images/services/f1", "/api/images/services/f2"])
})

test("the stock cover is used when there is no upload", () => {
  assert.equal(serviceCoverUrl([], "https://picsum.photos/seed/x/800/600"), "https://picsum.photos/seed/x/800/600")
  assert.deepEqual(serviceGalleryUrls([], "https://images.unsplash.com/photo-1?w=800"), ["https://images.unsplash.com/photo-1?w=800"])
  assert.equal(serviceCoverUrl([], null), null)
  assert.deepEqual(serviceGalleryUrls([], undefined), [])
})

test("only absolute https URLs are accepted from the column", () => {
  for (const bad of ["javascript:alert(1)", "http://example.com/a.jpg", "/relative.jpg", "not a url", "", "data:image/png;base64,AAAA"]) {
    assert.equal(externalCoverUrl(bad), null, bad)
  }
  assert.equal(externalCoverUrl("  https://picsum.photos/seed/a/800/600 "), "https://picsum.photos/seed/a/800/600")
})

test("card summary trims on a word boundary", () => {
  assert.equal(cardSummary("Short text."), "Short text.")
  assert.equal(cardSummary("  many   spaces\nhere "), "many spaces here")
  const long = "Thorough clean of floors, bathrooms, kitchen and the inside of windows, plus balconies and the entrance hall."
  const out = cardSummary(long, 60)
  assert.ok(out.length <= 61, out)
  assert.ok(out.endsWith("…"))
  assert.ok(!out.includes(" …"))
})
