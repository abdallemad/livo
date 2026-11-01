import { test } from "node:test"
import assert from "node:assert/strict"
import { availableToRequest, heldNet, maskDestination, normalizeDestination, payoutRequestBlockedReason } from "@/utils/provider-wallet"

test("available = balance minus every open payout, never negative", () => {
  assert.equal(availableToRequest(6000, 0), 6000)
  assert.equal(availableToRequest(6000, 5000), 1000)
  assert.equal(availableToRequest(-150, 0), 0)
  assert.equal(availableToRequest(100.1, 0.2), 99.9)
})

test("held money shown as the provider's future net", () => {
  assert.equal(heldNet([{ amount: 1000, refundedAmount: 0, commissionRate: 10 }, { amount: 500, refundedAmount: 100, commissionRate: 12.5 }]), 1250)
  assert.equal(heldNet([]), 0)
})

test("request rules: active account, one open request, minimum, within available", () => {
  const ok = { providerApproved: true, hasOpenRequest: false, amount: 500, available: 1000 }
  assert.equal(payoutRequestBlockedReason(ok), null)
  assert.match(payoutRequestBlockedReason({ ...ok, providerApproved: false })!, /isn't active/)
  assert.match(payoutRequestBlockedReason({ ...ok, hasOpenRequest: true })!, /already have/)
  assert.match(payoutRequestBlockedReason({ ...ok, available: 50 })!, /at least 100/)
  assert.match(payoutRequestBlockedReason({ ...ok, amount: 99 })!, /minimum/)
  assert.match(payoutRequestBlockedReason({ ...ok, amount: 1000.01 })!, /up to 1000/)
  assert.equal(payoutRequestBlockedReason({ ...ok, amount: 1000 }), null)
})

test("wallet destinations: Egyptian mobiles (any format) and InstaPay", () => {
  assert.deepEqual(normalizeDestination("WALLET", "+20 101 234 5678"), { ok: true, value: "01012345678" })
  assert.deepEqual(normalizeDestination("WALLET", "٠١١٢٣٤٥٦٧٨٩"), { ok: true, value: "01123456789" })
  assert.deepEqual(normalizeDestination("WALLET", "Ahmed.S@InstaPay"), { ok: true, value: "ahmed.s@instapay" })
  assert.equal(normalizeDestination("WALLET", "0101234").ok, false)
  assert.equal(normalizeDestination("WALLET", "01412345678").ok, false)
})

test("bank destinations: IBAN or account number", () => {
  assert.deepEqual(normalizeDestination("BANK", "eg38 0019 0005 0000 0000 2631 8000 2"), { ok: true, value: "EG380019000500000000263180002" })
  assert.deepEqual(normalizeDestination("BANK", "1234-5678-9012"), { ok: true, value: "123456789012" })
  assert.equal(normalizeDestination("BANK", "EG12").ok, false)
  assert.equal(normalizeDestination("BANK", "abc").ok, false)
})

test("destinations are masked in lists", () => {
  assert.equal(maskDestination("01012345678"), "••••5678")
  assert.equal(maskDestination("ahmed.s@instapay"), "ah•••@instapay")
  assert.equal(maskDestination("CIB ••••4421"), "CIB ••••4421")
})
