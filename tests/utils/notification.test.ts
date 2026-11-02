import { test } from "node:test"
import assert from "node:assert/strict"
import { markNotificationsReadSchema, notificationListQuerySchema } from "@/schemas/notification.schema"
import { countBadge, notificationHref } from "@/utils/notification"

test("customer links", () => {
  assert.equal(notificationHref("QUOTE_RECEIVED", { requestId: "r1", quoteId: "q1" }, "CUSTOMER"), "/account/requests/r1")
  assert.equal(notificationHref("BOOKING_CONFIRMED", { bookingId: "b1" }, "CUSTOMER"), "/account/bookings/b1")
  assert.equal(notificationHref("PAYMENT_UPDATE", { bookingId: "b1" }, "CUSTOMER"), "/account/bookings/b1")
  assert.equal(notificationHref("SYSTEM", { userStatus: "ACTIVE" }, "CUSTOMER"), "/account")
  assert.equal(notificationHref("QUOTE_RECEIVED", null, "CUSTOMER"), "/account/requests")
})

test("provider links", () => {
  assert.equal(notificationHref("QUOTE_ACCEPTED", { requestId: "r1", bookingId: "b1" }, "PROVIDER"), "/provider/requests/r1")
  assert.equal(notificationHref("NEW_REQUEST_MATCH", { requestId: "r2" }, "PROVIDER"), "/provider/requests/r2")
  assert.equal(notificationHref("BOOKING_CREATED", { bookingId: "b1" }, "PROVIDER"), "/provider/bookings/b1")
  assert.equal(notificationHref("SYSTEM", { requestId: "r1", quoteId: "q" }, "PROVIDER"), "/provider/requests/r1")
  assert.equal(notificationHref("PROVIDER_DECISION", {}, "PROVIDER"), "/provider/verification")
  assert.equal(notificationHref("PAYOUT_UPDATE", {}, "PROVIDER"), "/provider/earnings")
})

test("admin links and unsafe payloads", () => {
  assert.equal(notificationHref("PAYMENT_UPDATE", { bookingId: "b1", paymentId: "p" }, "ADMIN"), "/admin/bookings/b1")
  assert.equal(notificationHref("BOOKING_CONFIRMED", { bookingId: "../x?y" }, "CUSTOMER"), "/account/bookings/..%2Fx%3Fy")
  assert.equal(notificationHref("BOOKING_CONFIRMED", { bookingId: 42 }, "CUSTOMER"), "/account")
  assert.equal(notificationHref("BOOKING_CONFIRMED", "nope", "CUSTOMER"), "/account")
})

test("badge text and schemas", () => {
  assert.equal(countBadge(3), "3")
  assert.equal(countBadge(10), "9+")
  assert.equal(notificationListQuerySchema.parse({}).filter, "all")
  assert.equal(notificationListQuerySchema.safeParse({ filter: "read" }).success, false)
  assert.deepEqual(markNotificationsReadSchema.parse({}), {})
  assert.equal(markNotificationsReadSchema.safeParse({ ids: Array(101).fill("x") }).success, false)
})
