import { test } from "node:test"
import assert from "node:assert/strict"
import { resubmitBlockedReason, verificationAccess } from "@/utils/verification"

test("only a rejected provider can change their identity documents and resubmit", () => {
  assert.deepEqual(verificationAccess("REJECTED"), { canEditIdentity: true, canEditCertificates: true, canResubmit: true, continueOnboarding: false })
  for (const s of ["PENDING", "APPROVED", "SUSPENDED", "DRAFT"] as const) {
    assert.equal(verificationAccess(s).canEditIdentity, false, s)
    assert.equal(verificationAccess(s).canResubmit, false, s)
  }
})

test("approved providers may still add or remove certificates; under review / suspended may not", () => {
  assert.equal(verificationAccess("APPROVED").canEditCertificates, true)
  assert.equal(verificationAccess("PENDING").canEditCertificates, false)
  assert.equal(verificationAccess("SUSPENDED").canEditCertificates, false)
  assert.equal(verificationAccess("DRAFT").continueOnboarding, true)
})

test("resubmitting needs REJECTED plus a national ID and a selfie", () => {
  assert.equal(resubmitBlockedReason("REJECTED", { nationalId: 1, selfie: 1 }), null)
  assert.match(resubmitBlockedReason("REJECTED", { nationalId: 1, selfie: 0 })!, /selfie/)
  assert.match(resubmitBlockedReason("PENDING", { nationalId: 1, selfie: 1 })!, /already being reviewed/)
  assert.match(resubmitBlockedReason("APPROVED", { nationalId: 1, selfie: 1 })!, /Only a rejected/)
})
