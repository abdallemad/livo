import { test } from "node:test"
import assert from "node:assert/strict"
import { HIDDEN_CONTACT, maskContactDetails } from "@/utils/contact-mask"

test("Egyptian mobiles in many shapes are hidden", () => {
  for (const s of ["01012345678", "+20 101 234 5678", "0020-101-234-5678", "010 1234 5678", "٠١٠١٢٣٤٥٦٧٨"]) {
    const r = maskContactDetails(`call me ${s} please`)
    assert.equal(r.masked, true, s)
    assert.equal(r.text, `call me ${HIDDEN_CONTACT} please`, s)
  }
})

test("emails and WhatsApp / Telegram links are hidden", () => {
  assert.equal(maskContactDetails("mail a.b@example.com").text, `mail ${HIDDEN_CONTACT}`)
  assert.equal(maskContactDetails("https://wa.me/201012345678").text, HIDDEN_CONTACT)
  assert.equal(maskContactDetails("t.me/someone ok").text, `${HIDDEN_CONTACT} ok`)
})

test("ordinary numbers stay (prices, sizes, floors, dates)", () => {
  const text = "Flat 140 m², 3rd floor, budget 15000 EGP, on 12/11/2026, 2 AC units"
  assert.deepEqual(maskContactDetails(text), { text, masked: false })
})
