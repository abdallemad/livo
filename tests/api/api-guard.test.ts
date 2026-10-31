import { test } from "node:test"
import assert from "node:assert/strict"
import { isCrossSiteApiWrite } from "@/lib/api-guard"

const base = { pathname: "/api/me", host: "livo.app" }

test("safe methods are never blocked", () => {
  assert.equal(isCrossSiteApiWrite({ ...base, method: "GET", origin: "https://evil.example" }), false)
})

test("same-origin writes pass", () => {
  assert.equal(isCrossSiteApiWrite({ ...base, method: "POST", origin: "https://livo.app" }), false)
})

test("cross-site and origin-less writes are blocked", () => {
  assert.equal(isCrossSiteApiWrite({ ...base, method: "POST", origin: "https://evil.example" }), true)
  assert.equal(isCrossSiteApiWrite({ ...base, method: "DELETE", origin: null }), true)
})

test("webhooks are exempt and non-API paths ignored", () => {
  assert.equal(
    isCrossSiteApiWrite({ ...base, pathname: "/api/webhooks/payments", method: "POST", origin: null }),
    false,
  )
  assert.equal(isCrossSiteApiWrite({ ...base, pathname: "/about", method: "POST", origin: null }), false)
})

test("explicitly allowed origins pass", () => {
  assert.equal(
    isCrossSiteApiWrite({
      ...base,
      method: "PATCH",
      origin: "https://www.livo.app",
      allowedOrigins: ["https://www.livo.app"],
    }),
    false,
  )
})
