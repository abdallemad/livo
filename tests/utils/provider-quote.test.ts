import { test } from "node:test"
import assert from "node:assert/strict"
import { quoteWithdrawBlockedReason } from "@/utils/provider-quote"

test("a waiting quote on an open request can be withdrawn", () => {
  assert.equal(quoteWithdrawBlockedReason("PENDING", "OPEN"), null)
})

test("accepted, closed or late quotes can't be withdrawn", () => {
  assert.match(quoteWithdrawBlockedReason("ACCEPTED", "ACCEPTED")!, /booking now/)
  for (const s of ["REJECTED", "WITHDRAWN", "EXPIRED"] as const) assert.match(quoteWithdrawBlockedReason(s, "OPEN")!, /already closed/)
  for (const r of ["ACCEPTED", "CANCELLED", "EXPIRED"] as const) assert.match(quoteWithdrawBlockedReason("PENDING", r)!, /request is closed/)
})
