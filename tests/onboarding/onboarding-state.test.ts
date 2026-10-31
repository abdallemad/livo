import { test } from "node:test"
import assert from "node:assert/strict"
import { assertStepEditable, canFinish, deriveOnboardingState, homeFor, type OnboardingSnapshot } from "@/utils/onboarding-state"

const NOW = new Date("2026-11-01T10:00:00Z")
const LONG_BIO = "سباك بخبرة طويلة في الشقق والفيلات وبشتغل بخامات مضمونة."

const blank: OnboardingSnapshot = {
  role: "CUSTOMER",
  roleSelectedAt: null,
  onboardingCompletedAt: null,
  name: "",
  cityId: null,
  hasDefaultAddress: false,
  interestsCount: 0,
  provider: null,
}

const provider = (over: Partial<NonNullable<OnboardingSnapshot["provider"]>> = {}): OnboardingSnapshot["provider"] => ({
  verificationStatus: "DRAFT",
  bio: LONG_BIO,
  yearsExperience: 5,
  categoriesCount: 1,
  areasCount: 1,
  documentTypes: ["NATIONAL_ID", "SELFIE"],
  servicesCount: 1,
  canOfferFixedPrice: true,
  ...over,
})

test("a new user starts at the role step and nothing else is open", () => {
  const s = deriveOnboardingState(blank)
  assert.equal(s.role, null)
  assert.equal(s.currentStep, "role")
  assert.deepEqual([...s.steps], ["role"])
  assert.deepEqual(assertStepEditable(s, "basic"), { ok: false, reason: "WRONG_ROLE" })
})

test("the default CUSTOMER role does not count until the user picks it", () => {
  assert.equal(deriveOnboardingState({ ...blank, role: "CUSTOMER" }).role, null)
  assert.equal(deriveOnboardingState({ ...blank, roleSelectedAt: NOW }).role, "CUSTOMER")
})

test("customer: optional steps never block, resume lands on the first missing required step", () => {
  const picked = deriveOnboardingState({ ...blank, roleSelectedAt: NOW })
  assert.equal(picked.currentStep, "basic")
  assert.deepEqual(assertStepEditable(picked, "interests"), { ok: false, reason: "LOCKED" })

  const basicDone = deriveOnboardingState({ ...blank, roleSelectedAt: NOW, name: "منى", cityId: "c1" })
  assert.equal(basicDone.currentStep, "address")
  assert.equal(canFinish(basicDone), true)
  assert.deepEqual(assertStepEditable(basicDone, "interests"), { ok: true })
})

test("provider: basic needs a primary area, steps unlock in order", () => {
  const p = { ...blank, role: "PROVIDER" as const, roleSelectedAt: NOW, name: "محمود", cityId: "c1" }
  assert.equal(deriveOnboardingState({ ...p, provider: null }).currentStep, "basic")

  const noDocs = deriveOnboardingState({ ...p, provider: provider({ documentTypes: ["NATIONAL_ID"], servicesCount: 0 }) })
  assert.equal(noDocs.currentStep, "documents")
  assert.deepEqual(assertStepEditable(noDocs, "service"), { ok: false, reason: "LOCKED" })
  assert.equal(canFinish(noDocs), false)
})

test("provider: short bio keeps the profile step open", () => {
  const s = deriveOnboardingState({
    ...blank,
    role: "PROVIDER",
    roleSelectedAt: NOW,
    name: "محمود",
    cityId: "c1",
    provider: provider({ bio: "قصيرة" }),
  })
  assert.equal(s.currentStep, "profile")
})

test("provider: quote-only trades skip the fixed-price service requirement", () => {
  const s = deriveOnboardingState({
    ...blank,
    role: "PROVIDER",
    roleSelectedAt: NOW,
    name: "عماد",
    cityId: "c1",
    provider: provider({ servicesCount: 0, canOfferFixedPrice: false }),
  })
  assert.ok(s.doneSteps.includes("service"))
  assert.equal(s.currentStep, "review")
  assert.equal(canFinish(s), true)
})

test("provider who can offer fixed prices must create a service", () => {
  const s = deriveOnboardingState({
    ...blank,
    role: "PROVIDER",
    roleSelectedAt: NOW,
    name: "محمود",
    cityId: "c1",
    provider: provider({ servicesCount: 0 }),
  })
  assert.equal(s.currentStep, "service")
  assert.equal(canFinish(s), false)
})

test("after completion nothing is editable, not even the role", () => {
  const s = deriveOnboardingState({
    ...blank,
    roleSelectedAt: NOW,
    onboardingCompletedAt: NOW,
    name: "منى",
    cityId: "c1",
  })
  assert.equal(s.completed, true)
  assert.deepEqual(assertStepEditable(s, "role"), { ok: false, reason: "COMPLETED" })
  assert.equal(canFinish(s), false)
})

test("a customer can't save provider steps", () => {
  const s = deriveOnboardingState({ ...blank, roleSelectedAt: NOW, name: "منى", cityId: "c1" })
  assert.deepEqual(assertStepEditable(s, "documents"), { ok: false, reason: "WRONG_ROLE" })
})

test("admins never onboard", () => {
  assert.equal(deriveOnboardingState({ ...blank, role: "ADMIN" }).completed, true)
})

test("homeFor routes by role and onboarding status", () => {
  assert.equal(homeFor({ role: "CUSTOMER", onboardingCompleted: false }), "/onboarding")
  assert.equal(homeFor({ role: "PROVIDER", onboardingCompleted: true }), "/provider")
  assert.equal(homeFor({ role: "CUSTOMER", onboardingCompleted: true }), "/account")
  assert.equal(homeFor({ role: "ADMIN", onboardingCompleted: false }), "/admin")
})
