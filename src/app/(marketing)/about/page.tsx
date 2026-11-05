import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { CmsBody, HelpCta, HelpNav, IconCard } from "@/components/help"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { MotionProvider } from "@/components/motion/MotionProvider"
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { ABOUT_PAGE as A } from "@/constants/help"
import { LAUNCH_CITY } from "@/constants/site"
import { TRUST_STRIP } from "@/constants/trust"
import { getPublishedPage } from "@/services/static-page.service"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd } from "@/utils/structured-data"

/**
 * /about — who we are (docs/SITEMAP.md §2, MK-05; docs/help-pages-feature.md). Built-in story, values and the two
 * audiences always render (constants/help.ts). When an admin publishes the `about` StaticPage (AD-10), its sanitised
 * body becomes the "From the team" note — the page no longer 404s without it. ISR (hourly + `revalidateStorefront()`).
 */
export const revalidate = 3600

export const metadata: Metadata = pageMetadata({
  title: A.title,
  description: "Who we are, why we started and what we stand for: verified providers, clear prices and protected payments.",
  path: "/about",
})

async function loadCms() {
  try {
    return await getPublishedPage("about")
  } catch (error) {
    console.error("[about] admin content skipped (database unavailable)", error)
    return null
  }
}

export default async function AboutPage() {
  const cms = await loadCms()
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: A.title, path: "/about" },
        ])}
      />
      <MotionProvider>
        <PageHero title={A.title} ghost="About" lead={A.lead} />
        <HelpNav active="/about" />

        {/* Story */}
        <section aria-labelledby="story-title" className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
          <div>
            <SectionHeading id="story-title" ghost="Story" align="start" title={A.storyTitle} className="mb-2" />
            <div className="space-y-4 ps-2.5 text-[17px] leading-relaxed text-muted-foreground">
              {A.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#0b1150_0%,#1b1466_55%,#2c1a83_100%)] p-8 text-white shadow-pop md:p-10">
              <span aria-hidden className="absolute -end-20 -top-20 -z-10 size-72 rounded-full bg-[radial-gradient(circle,rgb(255_61_90/0.35),transparent_65%)]" />
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold">
                <MapPin className="size-4 text-coral" aria-hidden />
                Now live in {LAUNCH_CITY}
              </span>
              <p className="mt-6 font-heading text-2xl leading-snug font-bold md:text-3xl">Every provider checked by our own team.</p>
              <ul className="mt-6 space-y-3">
                {TRUST_STRIP.map((t) => (
                  <li key={t.label} className="flex items-start gap-3 text-[15px] text-white/85">
                    <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-brand-gradient" />
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        {cms ? (
          <section aria-labelledby="team-note-title" className="defer-render mx-auto max-w-4xl px-4 pb-14 md:px-6">
            <h2 id="team-note-title" className="mb-4 text-center font-heading text-2xl font-bold">
              From the team
            </h2>
            <CmsBody html={cms.html} />
          </section>
        ) : null}

        {/* Values */}
        <section aria-labelledby="values-title" className="defer-render bg-page-gradient">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
            <SectionHeading id="values-title" ghost="Values" title={A.valuesTitle} className="mb-8 md:mb-10" />
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {A.values.map((v) => (
                <StaggerItem key={v.title} className="h-full">
                  <IconCard icon={v.icon} title={v.title}>
                    {v.body}
                  </IconCard>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        {/* Two sides */}
        <section aria-labelledby="sides-title" className="defer-render mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="sides-title" ghost="Both" title={A.sidesTitle} className="mb-8 md:mb-10" />
          <StaggerList className="grid gap-5 md:grid-cols-2">
            {A.sides.map((s, i) => (
              <StaggerItem key={s.title} className="h-full">
                <div className={i === 0 ? "flex h-full flex-col rounded-[28px] border bg-card p-7 shadow-card md:p-9" : "relative isolate flex h-full flex-col overflow-hidden rounded-[28px] bg-brand-gradient p-7 text-white shadow-glow md:p-9"}>
                  <h3 className="font-heading text-2xl font-bold">{s.title}</h3>
                  <p className={i === 0 ? "mt-2 text-muted-foreground" : "mt-2 text-white/85"}>{s.body}</p>
                  <div className="mt-auto pt-6">
                    <Button size="lg" className={i === 0 ? undefined : "bg-white text-navy hover:bg-white/90"} render={<Link href={s.href} />}>
                      {s.cta}
                      <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <HelpCta />
      </MotionProvider>
    </>
  )
}
