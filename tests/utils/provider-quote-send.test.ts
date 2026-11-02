import { test } from "node:test"
import assert from "node:assert/strict"
import { providerQuoteSchema } from "@/schemas/provider.schema"
import { quoteSendBlockedReason, quoteSendMode, quoteValidUntil } from "@/utils/provider-quote"

const ok = { approved: true, requestStatus: "OPEN" as const, requestExpired: false, existing: null, ownRequest: false }

test("an approved provider can quote an open request", () => {
  assert.equal(quoteSendBlockedReason(ok), null)
  assert.equal(quoteSendBlockedReason({ ...ok, existing: "PENDING" }), null)
  assert.equal(quoteSendBlockedReason({ ...ok, existing: "WITHDRAWN" }), null)
  assert.equal(quoteSendBlockedReason({ ...ok, existing: "EXPIRED" }), null)
})

test("quoting is refused with a reason", () => {
  assert.match(quoteSendBlockedReason({ ...ok, ownRequest: true })!, /own request/)
  assert.match(quoteSendBlockedReason({ ...ok, approved: false })!, /isn't active/)
  assert.match(quoteSendBlockedReason({ ...ok, existing: "ACCEPTED" })!, /booking now/)
  assert.match(quoteSendBlockedReason({ ...ok, existing: "REJECTED" })!, /another quote/)
  assert.match(quoteSendBlockedReason({ ...ok, requestStatus: "ACCEPTED" })!, /closed/)
  assert.match(quoteSendBlockedReason({ ...ok, requestExpired: true })!, /closed/)
})

test("send mode", () => {
  assert.equal(quoteSendMode(null), "CREATE")
  assert.equal(quoteSendMode("PENDING"), "UPDATE")
  assert.equal(quoteSendMode("WITHDRAWN"), "RESEND")
  assert.equal(quoteSendMode("EXPIRED"), "RESEND")
  assert.equal(quoteValidUntil(new Date("2026-11-02T00:00:00Z"), 7).toISOString(), "2026-11-09T00:00:00.000Z")
})

test("quote schema", () => {
  const parsed = providerQuoteSchema.parse({ price: "1200", durationDays: "", message: "", validDays: "14" })
  assert.deepEqual(parsed, { price: 1200, durationDays: undefined, message: undefined, validDays: 14 })
  assert.equal(providerQuoteSchema.parse({ price: 500 }).validDays, 7)
  assert.equal(providerQuoteSchema.safeParse({ price: 10 }).success, false)
  assert.equal(providerQuoteSchema.safeParse({ price: 500, durationDays: "1.5" }).success, false)
  assert.equal(providerQuoteSchema.safeParse({ price: 500, validDays: 5 }).success, false)
  assert.equal(providerQuoteSchema.safeParse({ price: 500, message: "call me on 01012345678" }).success, false)
})
