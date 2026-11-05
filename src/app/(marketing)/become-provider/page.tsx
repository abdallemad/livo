import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, CircleCheckBig, LogIn, Sparkles } from "lucide-react"
import { FaqList, FlowSteps, IconCard, StepTimeline } from "@/components/help"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { AnimatedTitle } from "@/components/motion/AnimatedTitle"
import { MotionProvider } from "@/components/motion/MotionProvider"
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { BECOME_PROVIDER as P } from "@/constants/help"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd, faqJsonLd } from "@/utils/structured-data"

/**
 * /become-provider — provider recruitment (docs/SITEMAP.md §2, MK-04; docs/help-pages-feature.md).
 * STATIC: copy from `constants/help.ts`, no DB and no request reads. Sections: hero with the two entry points → six
 * benefits → two ways to earn → the onboarding steps beside a "what you need" checklist → how payouts work → provider
 * FAQ (+ FAQPage JSON-LD) → final CTA (the page's one gradient commit button).
 */
export const metadata: Metadata = pageMetadata({
  title: "Join as a provider",
  description: "Get requests in your areas, set your own prices and get paid safely. Apply in a few minutes.",
  path: "/become-provider",
})

const SIGN_UP = "/sign-up"
const SIGN_IN = "/sign-in"

export default function BecomeProviderPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Join as a provider", path: "/become-provider" },
          ]),
          faqJsonLd(P.faq),
        ]}
      />
      <MotionProvider>
        <PageHero title={P.title} ghost="Join" lead={P.lead}>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<Link href={SIGN_UP} />}>
              {P.primaryCta}
              <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" render={<Link href={SIGN_IN} />}>
              <LogIn data-icon="inline-start" aria-hidden />
              {P.secondaryCta}
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {P.chips.map((c) => (
              <li key={c} className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3.5 py-1.5 text-sm shadow-soft">
                <CircleCheckBig className="size-4 text-coral" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </PageHero>

        {/* Benefits */}
        <section aria-labelledby="benefits-title" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="benefits-title" ghost="Why" title="Why providers choose us" lead="Everything you need to win jobs and get paid — nothing you don't." className="mb-8 md:mb-10" />
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {P.benefits.map((b) => (
              <StaggerItem key={b.title} className="h-full">
                <IconCard icon={b.icon} title={b.title}>
                  {b.body}
                </IconCard>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        {/* Two ways to earn */}
        <section aria-labelledby="ways-title" className="defer-render bg-page-gradient">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
            <SectionHeading id="ways-title" ghost="Earn" title="Two ways to earn" lead="Offer one or both — it depends on your trade." className="mb-8 md:mb-10" />
            <StaggerList className="grid gap-5 md:grid-cols-2">
              {P.ways.map((w, i) => (
                <StaggerItem key={w.title} className="h-full">
                  <div className="relative isolate flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#0b1150_0%,#1b1466_55%,#2c1a83_100%)] p-7 text-white shadow-card md:p-9">
                    <span aria-hidden className="absolute -end-16 -top-16 -z-10 size-64 rounded-full bg-[radial-gradient(circle,rgb(255_61_90/0.3),transparent_65%)]" />
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-1.5 font-heading text-sm font-semibold shadow-glow">
                      <Sparkles className="size-3.5" aria-hidden />
                      Option {i + 1}
                    </span>
                    <h3 className="mt-5 font-heading text-2xl font-bold">{w.title}</h3>
                    <p className="mt-2 text-white/75">{w.body}</p>
                    <ul className="mt-6 space-y-2.5">
                      {w.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[15px]">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <Check className="size-3.5" aria-hidden />
                          </span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        {/* Steps + checklist */}
        <section aria-labelledby="steps-title" className="defer-render mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="steps-title" ghost="Steps" title="How to join" lead="Six short steps. Save and exit at any point — we keep your place." className="mb-8 md:mb-10" />
          <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
            <StepTimeline steps={P.steps} />
            <Reveal className="lg:sticky lg:top-24">
              <aside aria-labelledby="needs-title" className="rounded-[28px] border bg-card p-6 shadow-card md:p-7">
                <h3 id="needs-title" className="font-heading text-xl font-bold">
                  What you need
                </h3>
                <ul className="mt-4 space-y-3">
                  {P.needs.map((n) => (
                    <li key={n} className="flex items-start gap-3 text-[15px]">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      {n}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" render={<Link href={SIGN_UP} />}>
                  Start my application
                  <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
                </Button>
              </aside>
            </Reveal>
          </div>
        </section>

        {/* Payouts */}
        <section aria-labelledby="payout-title" className="defer-render bg-page-gradient">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-20">
            <SectionHeading id="payout-title" ghost="Payouts" title={P.payout.title} className="mb-8" />
            <Reveal>
              <FlowSteps steps={P.payout.steps} />
            </Reveal>
            <ul className="mx-auto grid max-w-4xl gap-3 md:grid-cols-3">
              {P.payout.notes.map((n) => (
                <li key={n} className="rounded-2xl border bg-card/90 p-4 text-sm text-muted-foreground shadow-soft">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="provider-faq-title" className="defer-render mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="provider-faq-title" ghost="FAQ" title="Provider questions" className="mb-6" />
          <Reveal>
            <FaqList items={P.faq} idPrefix="provider-faq" />
          </Reveal>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            More answers in the{" "}
            <Link href="/faq#providers" className="font-medium text-violet underline underline-offset-4 dark:text-primary">
              full FAQ
            </Link>
            .
          </p>
        </section>

        {/* Final CTA — the page's one commit button */}
        <section aria-labelledby="join-cta-title" className="defer-render">
          <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
            <Reveal scale>
              <div className="relative isolate overflow-hidden rounded-[36px] bg-[linear-gradient(120deg,#04123a,#0a1f5c_60%,#3a1a8a)] px-6 py-12 text-center text-white md:px-10 md:py-16">
                <span aria-hidden className="absolute -end-[10%] -top-[40%] -z-10 aspect-square w-3/5 rounded-full bg-[radial-gradient(circle,rgb(255_61_90/0.35),transparent_65%)]" />
                <span aria-hidden className="absolute -start-[10%] -bottom-[50%] -z-10 aspect-square w-2/5 rounded-full bg-[radial-gradient(circle,rgb(123_47_247/0.35),transparent_65%)]" />
                <AnimatedTitle id="join-cta-title" className="mx-auto max-w-3xl text-[clamp(24px,3.8vw,46px)] font-bold tracking-tight text-white" text={P.finalTitle} />
                <p className="mx-auto mt-3 mb-7 max-w-xl text-[#c9cee8]">{P.finalBody}</p>
                <Button size="lg" variant="commit" render={<Link href={SIGN_UP} />}>
                  {P.primaryCta}
                  <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </MotionProvider>
    </>
  )
}
