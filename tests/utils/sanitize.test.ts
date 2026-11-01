import { test } from "node:test"
import assert from "node:assert/strict"
import { sanitizePageHtml } from "@/utils/sanitize"

test("keeps content markup", () => {
  assert.equal(sanitizePageHtml("<h2>Title</h2><p>Some <strong>bold</strong> text</p>"), "<h2>Title</h2><p>Some <strong>bold</strong> text</p>")
})

test("drops scripts, handlers, styles and javascript: links", () => {
  const out = sanitizePageHtml('<p onclick="x()">Hi</p><script>alert(1)</script><style>p{}</style><a href="javascript:alert(1)">x</a><iframe src="//e"></iframe>')
  assert.ok(!/script|onclick|style|javascript|iframe/i.test(out), out)
  assert.match(out, /<p>Hi<\/p>/)
})

test("links get rel=noopener", () => {
  assert.match(sanitizePageHtml('<a href="https://example.com">x</a>'), /rel="noopener noreferrer"/)
})
