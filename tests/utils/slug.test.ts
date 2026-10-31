import { test } from "node:test"
import assert from "node:assert/strict"
import { slugify, uniqueSlug } from "@/utils/slug"

test("slugify lowercases and collapses separators", () => {
  assert.equal(slugify("  Hello,  World! "), "hello-world")
})

test("slugify keeps Arabic letters and drops diacritics", () => {
  assert.equal(slugify("سِباكة و كهرباء"), "سباكة-و-كهرباء")
})

test("uniqueSlug appends a counter until free", async () => {
  const taken = new Set(["plumbing", "plumbing-2"])
  assert.equal(await uniqueSlug("Plumbing", async (s) => taken.has(s)), "plumbing-3")
})
