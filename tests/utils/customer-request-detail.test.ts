import { test } from "node:test"
import assert from "node:assert/strict"
import { acceptQuoteSchema } from "@/schemas/customer.schema"
import { quoteAcceptBlockedReason, requestTimelineState, sortQuotes } from "@/utils/customer-request"

const NOW = new Date("2026-11-02T10:00:00Z")
const base = { requestStatus: "OPEN" as const, quoteStatus: "PENDING" as const, validUntil: null, providerActive: true, now: NOW }

test("a waiting, valid quote on an open request can be accepted", () => {
  assert.equal(quoteAcceptBlockedReason(base), null)
  assert.equal(quoteAcceptBlockedReason({ ...base, validUntil: new Date("2026-11-03T00:00:00Z") }), null)
})

test("accepting is refused with a reason", () => {
  assert.match(quoteAcceptBlockedReason({ ...base, requestStatus: "ACCEPTED" })!, /already accepted/)
  assert.match(quoteAcceptBlockedReason({ ...base, requestStatus: "EXPIRED" })!, /closed/)
  assert.match(quoteAcceptBlockedReason({ ...base, quoteStatus: "WITHDRAWN" })!, /isn't available/)
  assert.match(quoteAcceptBlockedReason({ ...base, validUntil: new Date("2026-11-01T00:00:00Z") })!, /expired/)
  assert.match(quoteAcceptBlockedReason({ ...base, providerActive: false })!, /can't take new work/)
})

const q = (id: string, price: number, rating: number, reviewsCount: number, createdAt: string) => ({ id, price, createdAt, provider: { rating, reviewsCount } })
const quotes = [q("a", 900, 4.2, 10, "2026-11-01T10:00:00Z"), q("b", 700, 4.8, 3, "2026-11-01T09:00:00Z"), q("c", 700, 4.9, 40, "2026-11-02T08:00:00Z")]

test("quotes sort by price, rating or date", () => {
  assert.deepEqual(sortQuotes(quotes, "price").map((x) => x.id), ["c", "b", "a"])
  assert.deepEqual(sortQuotes(quotes, "rating").map((x) => x.id), ["c", "b", "a"])
  assert.deepEqual(sortQuotes(quotes, "newest").map((x) => x.id), ["c", "a", "b"])
  assert.equal(quotes[0].id, "a") // input untouched
})

test("timeline state follows the request, then its booking", () => {
  assert.equal(requestTimelineState({ status: "OPEN", booking: null }), "OPEN")
  assert.equal(requestTimelineState({ status: "DRAFT", booking: null }), "OPEN")
  assert.equal(requestTimelineState({ status: "EXPIRED", booking: null }), "EXPIRED")
  const booking = (status: Parameters<typeof requestTimelineState>[0]["booking"] & object) => requestTimelineState({ status: "ACCEPTED", booking: status })
  assert.equal(booking({ status: "PENDING_PROVIDER", paidOnline: false, reviewed: false }), "ACCEPTED")
  assert.equal(booking({ status: "PENDING_PROVIDER", paidOnline: true, reviewed: false }), "PAID")
  assert.equal(booking({ status: "AWAITING_CONFIRMATION", paidOnline: true, reviewed: false }), "IN_PROGRESS")
  assert.equal(booking({ status: "COMPLETED", paidOnline: true, reviewed: false }), "COMPLETED")
  assert.equal(booking({ status: "CLOSED", paidOnline: false, reviewed: true }), "REVIEWED")
  assert.equal(booking({ status: "REJECTED", paidOnline: true, reviewed: false }), "CANCELLED")
  assert.equal(booking({ status: "DISPUTED", paidOnline: true, reviewed: false }), "DISPUTED")
})

test("accept schema", () => {
  assert.equal(acceptQuoteSchema.safeParse({ quoteId: "q1", paymentMethod: "CASH" }).success, true)
  assert.equal(acceptQuoteSchema.safeParse({ quoteId: "", paymentMethod: "CASH" }).success, false)
  assert.equal(acceptQuoteSchema.safeParse({ quoteId: "q1", paymentMethod: "CARD" }).success, false)
})
