import { test } from "node:test"
import assert from "node:assert/strict"
import { SERVICE_PRICE_MAX, SERVICE_PRICE_MIN } from "@/constants/onboarding"
import {
  basicInfoStepSchema,
  firstServiceStepSchema,
  nameSchema,
  providerProfileStepSchema,
  roleStepSchema,
  submitStepSchema,
} from "@/schemas/onboarding.schema"

const service = {
  title: "تركيب سخان غاز",
  categoryId: "cat1",
  description: "تركيب السخان وتوصيل المية والغاز واختبار التسريب.",
  price: 450,
  durationMinutes: 120,
}

test("role step accepts only the two self-service roles", () => {
  assert.ok(roleStepSchema.safeParse({ role: "PROVIDER" }).success)
  assert.equal(roleStepSchema.safeParse({ role: "ADMIN" }).success, false)
})

test("names: Arabic, Latin and mixed pass; digits and phone numbers don't", () => {
  for (const ok of ["محمد", "منى عبد الله", "Ahmed Samir", "عبد الرحمن O'Neil", "  أحمد  "]) {
    assert.ok(nameSchema.safeParse(ok).success, ok)
  }
  for (const bad of ["01012345678", "أحمد 0101", "م", "@ahmed", "٠١٠١٢٣٤٥٦٧٨"]) {
    assert.equal(nameSchema.safeParse(bad).success, false, bad)
  }
})

test("basic info: email optional, lower-cased; city required", () => {
  const parsed = basicInfoStepSchema.parse({ name: "منى", email: "Mona@Example.com", cityId: "c1", areaId: "" })
  assert.equal(parsed.email, "mona@example.com")
  assert.equal(parsed.areaId, null)
  assert.equal(basicInfoStepSchema.parse({ name: "منى", email: "", cityId: "c1" }).email, null)
  assert.equal(basicInfoStepSchema.safeParse({ name: "منى", cityId: "" }).success, false)
  assert.equal(basicInfoStepSchema.safeParse({ name: "منى", email: "not-an-email", cityId: "c1" }).success, false)
})

test("provider profile: needs a real bio, at least one category and area", () => {
  const base = { bio: "س".repeat(40), yearsExperience: "7", categoryIds: ["a"], areaIds: ["b"] }
  assert.equal(providerProfileStepSchema.parse(base).yearsExperience, 7)
  assert.equal(providerProfileStepSchema.safeParse({ ...base, bio: "قصيرة" }).success, false)
  assert.equal(providerProfileStepSchema.safeParse({ ...base, categoryIds: [] }).success, false)
  assert.equal(providerProfileStepSchema.safeParse({ ...base, yearsExperience: -1 }).success, false)
})

test("service price: positive, within bounds, at most 2 decimals", () => {
  assert.ok(firstServiceStepSchema.safeParse(service).success)
  assert.ok(firstServiceStepSchema.safeParse({ ...service, price: "450.50" }).success)
  assert.ok(firstServiceStepSchema.safeParse({ ...service, price: SERVICE_PRICE_MIN }).success)
  assert.ok(firstServiceStepSchema.safeParse({ ...service, price: SERVICE_PRICE_MAX }).success)
  for (const price of [0, -10, SERVICE_PRICE_MIN - 1, SERVICE_PRICE_MAX + 1, 99.999, "abc"]) {
    assert.equal(firstServiceStepSchema.safeParse({ ...service, price }).success, false, String(price))
  }
})

test("service: too many images rejected, imageIds default to empty", () => {
  assert.deepEqual(firstServiceStepSchema.parse(service).imageIds, [])
  assert.equal(firstServiceStepSchema.safeParse({ ...service, imageIds: ["1", "2", "3", "4", "5", "6"] }).success, false)
})

test("submit requires explicit terms acceptance", () => {
  assert.ok(submitStepSchema.safeParse({ acceptTerms: true }).success)
  assert.equal(submitStepSchema.safeParse({ acceptTerms: false }).success, false)
  assert.equal(submitStepSchema.safeParse({}).success, false)
})
