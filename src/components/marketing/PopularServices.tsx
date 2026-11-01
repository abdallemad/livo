import { createElement } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Wrench } from "lucide-react"
import { CategoryTile } from "@/components/catalog/CategoryTile"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { categoryIcon } from "@/constants/category-icons"
import type { CatalogCategory, CatalogServiceCard } from "@/types/catalog"
import { durationLabel } from "@/utils/catalog"
import { formatPrice } from "@/utils/format"

/**
 * Popular fixed-price services (docs/landing-page.md §3): title, "From X EGP", duration and the category icon, each a
 * real link to the service page. Data: `getPopularServices` (LIVE services only). With no services yet, the real
 * category tiles show instead — without prices, never invented ones.
 */
export function PopularServices({ services, categories }: { services: CatalogServiceCard[]; categories: CatalogCategory[] }) {
  if (!services.length && !categories.length) return null
  return (
    <section aria-labelledby="popular-title" className="defer-render">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 id="popular-title" className="text-2xl font-semibold md:text-3xl">
              {services.length ? "Popular services" : "What we cover"}
            </h2>
            <p className="text-muted-foreground">{services.length ? "Fixed prices you see before you book." : "Pick a category to request quotes from verified providers."}</p>
          </div>
          <Button variant="ghost" render={<Link href={services.length ? "/services" : "/category"} />}>
            {services.length ? "All services" : "All categories"}
            <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>
        {services.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.id}>
                <Card className="group h-full gap-0 py-0 transition-colors hover:border-primary/40">
                  <Link href={s.href} className="flex h-full items-start gap-4 p-4 focus-visible:outline-none">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {createElement(categoryIcon(s.categoryIconKey) ?? Wrench, { className: "size-6", "aria-hidden": true })}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block font-semibold leading-snug group-hover:text-primary">{s.title}</span>
                      <span className="block text-sm text-muted-foreground">{s.categoryName}</span>
                      <span className="flex flex-wrap items-center gap-x-3 pt-1 text-sm">
                        <span className="font-semibold tabular-nums">
                          From <bdi dir="ltr">{formatPrice(s.price)}</bdi>
                        </span>
                        {s.durationMinutes ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-3.5" aria-hidden />
                            {durationLabel(s.durationMinutes)}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <CategoryTile category={{ ...c, serviceCount: 0 }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
