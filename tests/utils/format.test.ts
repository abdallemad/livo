import { test } from "node:test"
import assert from "node:assert/strict"
import { formatNumber, formatPhone, formatPrice } from "@/utils/format"

test("formatPrice puts the dollar sign first, Western digits", () => {
  assert.equal(formatPrice(350), "$350")
  assert.equal(formatPrice(1250.5), "$1,250.5")
  assert.equal(formatPrice(-40), "-$40")
})

test("formatNumber never emits Arabic-Indic digits", () => {
  assert.doesNotMatch(formatNumber(1234567.5), /[٠-٩]/)
})

test("formatPhone normalises Egyptian mobiles", () => {
  assert.equal(formatPhone("01012345678"), "+20 101 234 5678")
  assert.equal(formatPhone("+201012345678"), "+20 101 234 5678")
  assert.equal(formatPhone("123"), "123")
})
