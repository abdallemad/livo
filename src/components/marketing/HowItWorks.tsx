"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HOW_IT_WORKS } from "@/constants/trust"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

/**
 * How it works (docs/landing-page.md §4): two tabs as a small client island. Both panels are `keepMounted`, so both
 * step lists are in the server HTML for crawlers; the inactive one is just hidden. Steps follow the website's "from
 * request to done" flow: numbered gradient discs (alternating with navy) joined by a dashed line on wide screens.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="defer-render bg-page-gradient">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <SectionHeading id="how-title" ghost="Steps" title={HOW_IT_WORKS.title} className="mb-6" />
        {/* One reveal for the whole tabs block: the inactive panel is hidden, so per-item scroll triggers would never fire there. */}
        <Reveal>
          <Tabs defaultValue={HOW_IT_WORKS.tabs[0].id} className="items-center">
            <TabsList>
              {HOW_IT_WORKS.tabs.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="px-5">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {HOW_IT_WORKS.tabs.map((t) => (
              <TabsContent key={t.id} value={t.id} keepMounted className="w-full pt-10">
                <ol className="relative grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {t.steps.map((step, i) => (
                    <li key={step.title} className="relative flex flex-col items-center px-2 text-center">
                      <span
                        aria-hidden
                        className={cn(
                          "relative mb-4 flex size-20 items-center justify-center rounded-full font-heading text-2xl font-bold text-white shadow-[0_22px_34px_-16px_rgb(196_43_155/0.6),inset_0_0_0_5px_rgb(255_255_255/0.3)]",
                          i % 2 === 0 ? "bg-brand-gradient" : "bg-brand-navy",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="block font-heading text-lg font-semibold">{step.title}</span>
                      <span className="mt-1 block max-w-xs text-[15px] text-muted-foreground">{step.body}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>
      </div>
    </section>
  )
}
