import { test } from "node:test"
import assert from "node:assert/strict"
import { getZoneRedirect, zoneFromPath } from "@/utils/zone-access"

test("signed-out visitors go to sign-in with a return url", () => {
  assert.equal(
    getZoneRedirect("account", { signedIn: false, role: null }, "/account/bookings"),
    "/sign-in?redirect_url=%2Faccount%2Fbookings"
  )
})

test("signed-in without a DB row finishes the sync first", () => {
  assert.equal(getZoneRedirect("provider", { signedIn: true, role: null }), "/auth-callback")
})

test("each role enters its own zone; admins enter all", () => {
  assert.equal(getZoneRedirect("account", { signedIn: true, role: "CUSTOMER" }), null)
  assert.equal(getZoneRedirect("provider", { signedIn: true, role: "PROVIDER" }), null)
  assert.equal(getZoneRedirect("account", { signedIn: true, role: "ADMIN" }), null)
  assert.equal(getZoneRedirect("provider", { signedIn: true, role: "ADMIN" }), null)
})

test("wrong role is redirected", () => {
  assert.equal(getZoneRedirect("provider", { signedIn: true, role: "CUSTOMER" }), "/onboarding")
  assert.equal(getZoneRedirect("account", { signedIn: true, role: "PROVIDER" }), "/provider")
})

test("zoneFromPath does not match look-alike public routes", () => {
  assert.equal(zoneFromPath("/account/requests"), "account")
  assert.equal(zoneFromPath("/provider"), "provider")
  assert.equal(zoneFromPath("/providers/abc"), null)
  assert.equal(zoneFromPath("/become-provider"), null)
})
