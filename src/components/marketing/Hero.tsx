import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HERO } from "@/constants/trust"
import { LAUNCH_CATEGORIES, LAUNCH_CITY } from "@/constants/site"

/** "plumbing, electrical and cleaning" — the launch services from constants, as one readable line. */
function servicesLine() {
  const labels = LAUNCH_CATEGORIES.map((c) => c.label)
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : (labels[0] ?? "")
}

/**
 * Hero (docs/landing-page.md §2): the outcome as the one H1, the launch city and services, two CTAs, and a service + area
 * search. The search is a plain GET form to `/services` (works before hydration; the landing page never reads
 * `searchParams` — the listing's island does).
 */
export function Hero({ areas }: { areas: { slug: string; name: string }[] }) {
  return (
    <section aria-labelledby="hero-title" className="bg-gradient-to-b from-primary/8 to-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-12 pb-10 md:px-6 md:pt-20 md:pb-14">
        <div className="max-w-3xl space-y-4">
          <h1 id="hero-title" className="text-4xl leading-tight font-semibold text-balance md:text-6xl">
            {HERO.title}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Now in {LAUNCH_CITY}: {servicesLine()} — by providers we check ourselves.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" variant="commit" render={<Link href="/services" />}>
              {HERO.primaryCta}
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/become-provider" />}>
              {HERO.secondaryCta}
            </Button>
          </div>
        </div>

        <form action="/services" method="get" role="search" aria-label="Find a service" className="grid max-w-3xl gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:grid-cols-[1fr_12rem_auto]">
          <label className="sr-only" htmlFor="hero-q">
            What do you need?
          </label>
          <input
            id="hero-q"
            name="q"
            type="search"
            placeholder="What do you need? e.g. water heater"
            className="h-12 min-w-0 rounded-xl bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <label className="sr-only" htmlFor="hero-area">
            Area
          </label>
          <select
            id="hero-area"
            name="area"
            defaultValue=""
            className="h-12 rounded-xl border-0 bg-muted/60 px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All of {LAUNCH_CITY}</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" className="h-12">
            <Search data-icon="inline-start" aria-hidden />
            Search
          </Button>
        </form>
      </div>
    </section>
  )
}
