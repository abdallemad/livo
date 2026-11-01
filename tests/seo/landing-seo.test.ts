import { test } from "node:test"
import assert from "node:assert/strict"
import { LANDING_FAQ } from "@/constants/trust"
import { landingMetadata } from "@/utils/seo-metadata"
import { faqJsonLd, websiteJsonLd } from "@/utils/structured-data"

test("landing metadata: absolute title, canonical /, relative OG url, shared OG defaults", () => {
  const m = landingMetadata({ title: "Livo — Trusted home services", description: "Book verified providers." })
  assert.deepEqual(m.title, { absolute: "Livo — Trusted home services" })
  assert.equal(m.alternates?.canonical, "/")
  const og = m.openGraph as Record<string, unknown>
  assert.equal(og.url, "/")
  assert.equal(og.siteName, "Livo")
})

test("FAQPage JSON-LD mirrors the visible FAQ entries one for one", () => {
  const ld = faqJsonLd(LANDING_FAQ) as { "@type": string; mainEntity: { name: string; acceptedAnswer: { text: string } }[] }
  assert.equal(ld["@type"], "FAQPage")
  assert.equal(ld.mainEntity.length, LANDING_FAQ.length)
  assert.equal(ld.mainEntity[0].name, LANDING_FAQ[0].q)
  assert.equal(ld.mainEntity[0].acceptedAnswer.text, LANDING_FAQ[0].a)
})

test("WebSite JSON-LD searches /services", () => {
  const ld = websiteJsonLd() as { potentialAction: { target: { urlTemplate: string } } }
  assert.match(ld.potentialAction.target.urlTemplate, /\/services\?q=\{search_term_string\}$/)
})

test("trust copy never promises a warranty, a money-back guarantee or refund terms", async () => {
  const trust = await import("@/constants/trust")
  const text = JSON.stringify(trust).toLowerCase()
  for (const banned of ["warranty", "guarantee", "money-back", "money back", "full refund", "refund within"]) assert.equal(text.includes(banned), false, banned)
  // payment protection is always scoped to online payments
  assert.match(trust.TRUST_STRIP.find((t) => t.icon === "payment")!.label, /online/i)
  assert.match(trust.MONEY_FLOW.footnote, /online/i)
})
