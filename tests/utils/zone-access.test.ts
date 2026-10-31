import { test } from "node:test"
import assert from "node:assert/strict"
import { getZoneRedirect, zoneFromPath } from "@/utils/zone-access"

const done = { signedIn: true, onboardingCompleted: true } as const
const fresh = { signedIn: true, onboardingCompleted: false } as const

test("signed-out visitors go to sign-in with a return url", () => {
  assert.equal(
    getZoneRedirect("account", { signedIn: false, role: null, onboardingCompleted: false }, "/account/bookings"),
    "/sign-in?redirect_url=%2Faccount%2Fbookings"
  )
  assert.equal(getZoneRedirect("onboarding", { signedIn: false, role: null, onboardingCompleted: false }), "/sign-in?redirect_url=%2Fonboarding")
})

test("signed-in without a DB row finishes the sync first", () => {
  assert.equal(getZoneRedirect("provider", { signedIn: true, role: null, onboardingCompleted: false }), "/auth-callback")
})

test("unfinished onboarding always goes back into the wizard", () => {
  assert.equal(getZoneRedirect("account", { ...fresh, role: "CUSTOMER" }), "/onboarding")
  assert.equal(getZoneRedirect("provider", { ...fresh, role: "PROVIDER" }), "/onboarding")
  assert.equal(getZoneRedirect("onboarding", { ...fresh, role: "CUSTOMER" }), null)
})

test("finished users never see the wizard again", () => {
  assert.equal(getZoneRedirect("onboarding", { ...done, role: "CUSTOMER" }), "/account")
  assert.equal(getZoneRedirect("onboarding", { ...done, role: "PROVIDER" }), "/provider")
  assert.equal(getZoneRedirect("onboarding", { ...done, role: "ADMIN" }), "/admin")
})

test("each role enters its own zone; admins enter all", () => {
  assert.equal(getZoneRedirect("account", { ...done, role: "CUSTOMER" }), null)
  assert.equal(getZoneRedirect("provider", { ...done, role: "PROVIDER" }), null)
  assert.equal(getZoneRedirect("account", { ...done, role: "ADMIN" }), null)
  assert.equal(getZoneRedirect("provider", { ...fresh, role: "ADMIN" }), null)
})

test("wrong role is sent to its own dashboard", () => {
  assert.equal(getZoneRedirect("provider", { ...done, role: "CUSTOMER" }), "/account")
  assert.equal(getZoneRedirect("account", { ...done, role: "PROVIDER" }), "/provider")
})

test("zoneFromPath does not match look-alike public routes", () => {
  assert.equal(zoneFromPath("/account/requests"), "account")
  assert.equal(zoneFromPath("/provider"), "provider")
  assert.equal(zoneFromPath("/onboarding"), "onboarding")
  assert.equal(zoneFromPath("/providers/abc"), null)
  assert.equal(zoneFromPath("/become-provider"), null)
  assert.equal(zoneFromPath("/onboarding-tips"), null)
})

test("suspended users are kept out of every zone", () => {
  assert.equal(getZoneRedirect("account", { ...done, role: "CUSTOMER", suspended: true }), "/account-suspended")
  assert.equal(getZoneRedirect("provider", { ...done, role: "PROVIDER", suspended: true }), "/account-suspended")
  assert.equal(getZoneRedirect("onboarding", { ...fresh, role: "CUSTOMER", suspended: true }), "/account-suspended")
  assert.equal(getZoneRedirect("account", { ...done, role: "CUSTOMER", suspended: false }), null)
})
