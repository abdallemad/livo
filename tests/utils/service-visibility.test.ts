import { test } from "node:test"
import assert from "node:assert/strict"
import { serviceVisibility } from "@/utils/service-visibility"

const live = {
  isActive: true,
  hiddenByAdmin: false,
  providerApproved: true,
  providerAccountActive: true,
  categoryActive: true,
  parentCategoryActive: null,
}

test("a switched-on service of an active provider in an active category is live", () => {
  assert.equal(serviceVisibility(live), "LIVE")
  assert.equal(serviceVisibility({ ...live, parentCategoryActive: true }), "LIVE")
})

test("admin hiding wins over everything, including the provider's own switch", () => {
  assert.equal(serviceVisibility({ ...live, hiddenByAdmin: true }), "HIDDEN_BY_ADMIN")
  assert.equal(serviceVisibility({ ...live, hiddenByAdmin: true, isActive: false, providerApproved: false }), "HIDDEN_BY_ADMIN")
})

test("an unapproved provider or a suspended account hides the service", () => {
  assert.equal(serviceVisibility({ ...live, providerApproved: false }), "PROVIDER_INACTIVE")
  assert.equal(serviceVisibility({ ...live, providerAccountActive: false }), "PROVIDER_INACTIVE")
})

test("an inactive category or parent category hides the service", () => {
  assert.equal(serviceVisibility({ ...live, categoryActive: false }), "CATEGORY_OFF")
  assert.equal(serviceVisibility({ ...live, parentCategoryActive: false }), "CATEGORY_OFF")
})

test("the provider's own switch comes last", () => {
  assert.equal(serviceVisibility({ ...live, isActive: false }), "PROVIDER_OFF")
})
