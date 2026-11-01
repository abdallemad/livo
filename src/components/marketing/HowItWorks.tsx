"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HOW_IT_WORKS } from "@/constants/trust"

/**
 * How it works (docs/landing-page.md §4): two tabs as a small client island. Both panels are `keepMounted`, so both
 * step lists are in the server HTML for crawlers; the inactive one is just hidden.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="defer-render bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6">
        <h2 id="how-title" className="text-2xl font-semibold md:text-3xl">
          {HOW_IT_WORKS.title}
        </h2>
        <Tabs defaultValue={HOW_IT_WORKS.tabs[0].id}>
          <TabsList>
            {HOW_IT_WORKS.tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="px-4">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {HOW_IT_WORKS.tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} keepMounted className="pt-6">
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {t.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-3 rounded-xl border bg-card p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground tabular-nums" aria-hidden>
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{step.title}</span>
                      <span className="text-sm text-muted-foreground">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
