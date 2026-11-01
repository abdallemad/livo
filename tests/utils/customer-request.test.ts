import { test } from "node:test"
import assert from "node:assert/strict"
import { customerRequestState, lowestPrice, requestCancelBlockedReason } from "@/utils/customer-request"

test("an open request with waiting quotes reads 'quotes received'", () => {
  assert.equal(customerRequestState("OPEN", 2), "QUOTES_RECEIVED")
  assert.equal(customerRequestState("OPEN", 0), "OPEN")
  assert.equal(customerRequestState("ACCEPTED", 0), "ACCEPTED")
  assert.equal(customerRequestState("EXPIRED", 3), "EXPIRED")
})

test("only drafts and open requests can be cancelled by the customer", () => {
  assert.equal(requestCancelBlockedReason("DRAFT"), null)
  assert.equal(requestCancelBlockedReason("OPEN"), null)
  assert.match(requestCancelBlockedReason("ACCEPTED")!, /booking/)
  assert.match(requestCancelBlockedReason("CANCELLED")!, /already closed/)
  assert.match(requestCancelBlockedReason("EXPIRED")!, /already closed/)
})

test("lowest price", () => {
  assert.equal(lowestPrice([1500, 1200, 1800]), 1200)
  assert.equal(lowestPrice([]), null)
})
