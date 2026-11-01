import type { Metadata } from "next"
import { FinalCta } from "@/components/marketing/FinalCta"
import { Hero } from "@/components/marketing/Hero"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { LandingFaq } from "@/components/marketing/LandingFaq"
import { MeetProviders } from "@/components/marketing/MeetProviders"
import { MoneyFlow } from "@/components/marketing/MoneyFlow"
import { PopularServices } from "@/components/marketing/PopularServices"
import { ProviderBand } from "@/components/marketing/ProviderBand"
import { SocialProof } from "@/components/marketing/SocialProof"
import { TrustStrip } from "@/components/marketing/TrustStrip"
import { WhyTrust } from "@/components/marketing/WhyTrust"
import { WorkGallery } from "@/components/marketing/WorkGallery"
import { JsonLd } from "@/components/seo/json-ld"
import { SITE_DESCRIPTION, SITE_TITLE } from "@/constants/site"
import { LANDING_FAQ } from "@/constants/trust"
import { getLandingData } from "@/services/landing.service"
import { landingMetadata } from "@/utils/seo-metadata"
import { faqJsonLd, organizationJsonLd, websiteJsonLd } from "@/utils/structured-data"

/**
 * `/` — the landing page (docs/SITEMAP.md §2, MK-01, docs/landing-page.md). Its job: make a skeptical customer trust a
 * platform they've never heard of.
 *
 * STATIC / ISR: reads nothing from the request (no auth / cookies / headers / searchParams). DB-driven sections come
 * from `getLandingData()` — a `cache()`d service call at build / regeneration (CLAUDE.md §2 read-only exception), with
 * visibility and social-proof thresholds applied inside it. Every DB section hides or falls back when empty; nothing
 * is invented. The header's account controls are a client island (`AccountControls`).
 */
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return landingMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION })
}

export default async function HomePage() {
  const data = await getLandingData()
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(), faqJsonLd(LANDING_FAQ)]} />
      <Hero areas={data.areas} />
      <TrustStrip />
      <PopularServices services={data.popularServices} categories={data.categories} />
      <HowItWorks />
      <WhyTrust policiesPublished={data.policiesPublished} />
      <MeetProviders providers={data.providers} />
      <WorkGallery images={data.gallery} />
      <SocialProof proof={data.proof} />
      <MoneyFlow />
      <LandingFaq />
      <ProviderBand />
      <FinalCta />
    </>
  )
}
