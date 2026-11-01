import { test } from "node:test"
import assert from "node:assert/strict"
import { commissionRateBodySchema, payoutStatusSchema } from "@/schemas/admin.schema"

const rate = (v: unknown) => commissionRateBodySchema.safeParse({ ratePercent: v })

test("commission rate accepts 0–50 with up to 2 decimals (strings from the form too)", () => {
  assert.equal(rate("12.5").data?.ratePercent, 12.5)
  assert.equal(rate("0").data?.ratePercent, 0)
  assert.equal(rate(50).data?.ratePercent, 50)
  assert.equal(rate("7.25").data?.ratePercent, 7.25)
})

test("a blank field is rejected, never saved as 0%", () => {
  assert.equal(rate("").success, false)
  assert.equal(rate("   ").success, false)
  assert.equal(rate(undefined).success, false)
})

test("out of range, too precise or not a number is rejected", () => {
  for (const v of ["-1", "50.01", "12.555", "abc"]) assert.equal(rate(v).success, false, String(v))
})

test("payout decisions: reject needs a reason, the paid reference is optional", () => {
  assert.equal(payoutStatusSchema.safeParse({ status: "APPROVED" }).success, true)
  assert.equal(payoutStatusSchema.safeParse({ status: "REJECTED" }).success, false)
  assert.equal(payoutStatusSchema.safeParse({ status: "REJECTED", reason: "Balance does not cover it after cash fees." }).success, true)
  assert.deepEqual(payoutStatusSchema.parse({ status: "PAID", reference: "  " }), { status: "PAID", reference: undefined })
  assert.equal(payoutStatusSchema.safeParse({ status: "PENDING" }).success, false)
})
