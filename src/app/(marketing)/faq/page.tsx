import { cache, createElement } from "react"
import type { Metadata } from "next"
import { CmsBody, FaqList, HELP_ICONS, HelpCta, HelpNav } from "@/components/help"
import { PageHero } from "@/components/marketing/PageHero"
import { MotionProvider } from "@/components/motion/MotionProvider"
import { Reveal } from "@/components/motion/Reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { FAQ_GROUPS } from "@/constants/help"
import { getPublishedPage } from "@/services/static-page.service"
import { formatDate } from "@/utils/format"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd, faqJsonLd } from "@/utils/structured-data"

/**
 * /faq — the help centre's answers (docs/SITEMAP.md §2, MK-05; docs/help-pages-feature.md).
 *
 * Built-in grouped answers (`FAQ_GROUPS`, constants/help.ts) always render, with a sticky topic index and FAQPage
 * JSON-LD. When an admin publishes the `faq` StaticPage (AD-10), its sanitised body is added below as "More answers"
 * — the page no longer 404s without it. ISR (hourly + `revalidateStorefront()`); a DB outage just drops that block.
 */
export const revalidate = 3600

const load = cache(async () => {
  try {
    return await getPublishedPage("faq")
  } catch (error) {
    console.error("[faq] admin content skipped (database unavailable)", error)
    return null
  }
})

export const metadata: Metadata = pageMetadata({
  title: "Frequently asked questions",
  description: "Answers about booking, payments, held funds, disputes, safety and joining as a provider.",
  path: "/faq",
})

export default async function FaqPage() {
  const cms = await load()
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqJsonLd(FAQ_GROUPS.flatMap((g) => g.items)),
        ]}
      />
      <MotionProvider>
        <PageHero title="Frequently asked questions" ghost="FAQ" lead="Quick answers about booking, payments, safety and working with us." />
        <HelpNav active="/faq" />

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[260px_1fr] lg:gap-12">
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Topics</p>
            <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible">
              {FAQ_GROUPS.map((g) => (
                <li key={g.id} className="shrink-0">
                  <a
                    href={`#${g.id}`}
                    className="group flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 text-sm font-semibold shadow-soft transition-[border-color,color] hover:border-coral hover:text-violet focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:text-foreground"
                  >
                    <span className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient text-white">
                      {createElement(HELP_ICONS[g.icon], { className: "size-4", "aria-hidden": true })}
                    </span>
                    {g.title}
                    <span className="ms-auto hidden text-xs font-normal text-muted-foreground tabular-nums lg:inline">{g.items.length}</span>
                  </a>
                </li>
              ))}
              {cms ? (
                <li className="shrink-0">
                  <a href="#more" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-violet dark:hover:text-foreground">
                    More answers
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="min-w-0 space-y-12">
            {FAQ_GROUPS.map((g) => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-28">
                <h2 id={`${g.id}-title`} className="mb-4 flex items-center gap-3 font-heading text-2xl font-bold">
                  {g.title}
                </h2>
                <Reveal>
                  <FaqList items={g.items} idPrefix={g.id} />
                </Reveal>
              </section>
            ))}
            {cms ? (
              <section id="more" aria-labelledby="more-title" className="scroll-mt-28">
                <h2 id="more-title" className="mb-1 font-heading text-2xl font-bold">
                  More answers
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">Last updated {formatDate(cms.updatedAt)}</p>
                <CmsBody html={cms.html} />
              </section>
            ) : null}
          </div>
        </div>

        <HelpCta hideFaq />
      </MotionProvider>
    </>
  )
}
