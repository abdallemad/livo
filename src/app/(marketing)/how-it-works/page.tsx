import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardList, Hammer, Tag } from "lucide-react"
import { FlowSteps, HelpCta, HelpNav, IconCard, StepTimeline } from "@/components/help"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { MotionProvider } from "@/components/motion/MotionProvider"
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { type HelpIconKey, HOW_IT_WORKS_PAGE as H } from "@/constants/help"
import { HOW_IT_WORKS, MONEY_FLOW, type TrustIconKey, WHY_TRUST } from "@/constants/trust"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd } from "@/utils/structured-data"

/**
 * /how-it-works — the full walkthrough (docs/SITEMAP.md §2, MK-03; docs/help-pages-feature.md). STATIC.
 * Customer flows reuse `HOW_IT_WORKS` (the landing tabs' copy) so the two never disagree; the provider flow, money
 * flow and promises come from `constants/help.ts` / `constants/trust.ts`. Both customer flows are server-rendered
 * side by side (no tabs) so every step is visible and crawlable.
 */
export const metadata: Metadata = pageMetadata({
  title: "How it works",
  description: "Clear steps for customers and providers: from the request to the finished job and payment.",
  path: "/how-it-works",
})

const FLOW_ICON = { fixed: Tag, quotes: ClipboardList } as const
const TRUST_ICON: Record<TrustIconKey, HelpIconKey> = { verified: "badge", payment: "wallet", price: "tag", reviews: "heart", support: "shield", privacy: "lock" }

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "How it works", path: "/how-it-works" },
        ])}
      />
      <MotionProvider>
        <PageHero title={H.title} ghost="Steps" lead={H.lead} />
        <HelpNav active="/how-it-works" />

        {/* Customer: both flows side by side */}
        <section aria-labelledby="customer-title" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="customer-title" ghost="Customers" title={H.customerTitle} lead="Two ways to get a job done — pick the one that fits." className="mb-8 md:mb-12" />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
            {HOW_IT_WORKS.tabs.map((t) => {
              const Icon = FLOW_ICON[t.id]
              return (
                <div key={t.id} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-soft">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="font-heading text-xl font-bold md:text-2xl">{t.label}</h3>
                  </div>
                  <StepTimeline steps={t.steps} />
                </div>
              )
            })}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<Link href="/services" />}>
              Browse services
              <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/account/requests/new" />}>
              Request a quote
            </Button>
          </div>
        </section>

        {/* Money */}
        <section aria-labelledby="money-title" className="defer-render bg-page-gradient">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-20">
            <SectionHeading id="money-title" ghost="Payments" title={MONEY_FLOW.title} className="mb-8" />
            <Reveal>
              <FlowSteps steps={MONEY_FLOW.steps} />
            </Reveal>
            <p className="text-center text-sm text-muted-foreground">{MONEY_FLOW.footnote}</p>
          </div>
        </section>

        {/* Promises */}
        <section aria-labelledby="promises-title" className="defer-render mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="promises-title" ghost="Trust" title={H.promisesTitle} lead={WHY_TRUST.intro} className="mb-8 md:mb-10" />
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_TRUST.cards.map((c) => (
              <StaggerItem key={c.title} className="h-full">
                <IconCard icon={TRUST_ICON[c.icon]} title={c.title}>
                  {c.body}
                </IconCard>
              </StaggerItem>
            ))}
          </StaggerList>
          <p className="mt-6 text-center text-sm text-muted-foreground">{WHY_TRUST.privacyNote}</p>
        </section>

        {/* Provider flow */}
        <section aria-labelledby="provider-title" className="defer-render bg-page-gradient">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <SectionHeading id="provider-title" ghost="Pros" align="start" title={H.providerTitle} lead="Get requests in your areas, do great work and get paid safely." className="mb-4" />
              <div className="flex flex-wrap gap-3 ps-2.5">
                <Button size="lg" render={<Link href="/become-provider" />}>
                  <Hammer data-icon="inline-start" aria-hidden />
                  Become a provider
                </Button>
              </div>
            </div>
            <StepTimeline steps={H.providerSteps} />
          </div>
        </section>

        <HelpCta />
      </MotionProvider>
    </>
  )
}
