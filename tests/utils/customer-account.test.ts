import { test } from "node:test"
import assert from "node:assert/strict"
import { addressLine, newAddressIsDefault, nextDefaultAfterDelete } from "@/utils/address-book"
import { contactVisible, customerNextStep, customerPaymentLabel, customerPaymentTotals } from "@/utils/customer-booking"

test("next step reads the booking status in the customer's words", () => {
  assert.match(customerNextStep("PENDING_PAYMENT"), /Finish paying/)
  assert.match(customerNextStep("AWAITING_CONFIRMATION", { deadline: "3 Nov, 10:00" }), /before 3 Nov, 10:00/)
  assert.match(customerNextStep("COMPLETED"), /leave a review/)
  assert.match(customerNextStep("COMPLETED", { reviewed: true }), /Thanks/)
  assert.match(customerNextStep("REJECTED"), /refunded/)
})

test("the provider's phone shows only while a confirmed booking is live (BR-02)", () => {
  assert.equal(contactVisible(true, "CONFIRMED"), true)
  assert.equal(contactVisible(true, "AWAITING_CONFIRMATION"), true)
  assert.equal(contactVisible(false, "CONFIRMED"), false)
  assert.equal(contactVisible(true, "CLOSED"), false)
  assert.equal(contactVisible(true, "PENDING_PROVIDER"), false)
})

test("payments in the customer's words", () => {
  assert.match(customerPaymentLabel("ONLINE", "PAID", "HELD"), /held safely/)
  assert.match(customerPaymentLabel("ONLINE", "PAID", "RELEASED"), /passed to the provider/)
  assert.match(customerPaymentLabel("CASH", "PENDING", "NONE"), /pay the provider/)
  assert.match(customerPaymentLabel("ONLINE", "REFUNDED", "REFUNDED"), /Refunded/)
})

test("payment totals: paid, refunded, held", () => {
  const t = customerPaymentTotals([
    { method: "ONLINE", status: "PAID", escrowState: "HELD", amount: 1000, refundedAmount: 0 },
    { method: "ONLINE", status: "PARTIALLY_REFUNDED", escrowState: "PARTIALLY_REFUNDED", amount: 800, refundedAmount: 300 },
    { method: "CASH", status: "PAID", escrowState: "NONE", amount: 250, refundedAmount: 0 },
    { method: "ONLINE", status: "PENDING", escrowState: "NONE", amount: 999, refundedAmount: 0 },
  ])
  assert.deepEqual(t, { paid: 2050, refunded: 300, held: 1000 })
})

test("addresses: one default, promoted on delete", () => {
  const a = [
    { id: "a", isDefault: true, createdAt: new Date("2026-01-01") },
    { id: "b", isDefault: false, createdAt: new Date("2026-03-01") },
    { id: "c", isDefault: false, createdAt: new Date("2026-02-01") },
  ]
  assert.equal(nextDefaultAfterDelete(a, "a"), "b")
  assert.equal(nextDefaultAfterDelete(a, "b"), null)
  assert.equal(nextDefaultAfterDelete([a[0]], "a"), null)
  assert.equal(newAddressIsDefault(0, false), true)
  assert.equal(newAddressIsDefault(2, false), false)
  assert.equal(addressLine({ street: "9 Road 9", details: null, area: "Maadi" }), "9 Road 9, Maadi")
})
