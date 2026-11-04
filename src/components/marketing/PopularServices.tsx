import { createElement } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Wrench } from "lucide-react"
import { CategoryTile } from "@/components/catalog/CategoryTile"
import { Button } from "@/components/ui/button"
import { categoryIcon } from "@/constants/category-icons"
import type { CatalogCategory, CatalogServiceCard } from "@/types/catalog"
import { durationLabel } from "@/utils/catalog"
import { formatPrice } from "@/utils/format"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

/**
 * Popular fixed-price services (docs/landing-page.md §3): title, "From $X", duration and the category icon, each a
 * real link to the service page. Data: `getPopularServices` (LIVE services only). With no services yet, the real
 * category tiles show instead — without prices, never invented ones.
 */
export function PopularServices({ services, categories }: { services: CatalogServiceCard[]; categories: CatalogCategory[] }) {
  if (!services.length && !categories.length) return null
  return (
    <section aria-labelledby="popular-title" className="defer-render">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <SectionHeading
          id="popular-title"
          ghost="Services"
          title={services.length ? "Popular services" : "What we cover"}
          lead={services.length ? "Fixed prices you see before you book." : "Pick a category to request quotes from verified providers."}
          className="mb-8 md:mb-10"
        />
        {services.length ? (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <StaggerItem key={s.id} lift>
                <Link
                  href={s.href}
                  className="group flex h-full items-start gap-4 rounded-3xl border bg-card p-5 shadow-soft transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-coral hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                    {createElement(categoryIcon(s.categoryIconKey) ?? Wrench, { className: "size-6", "aria-hidden": true })}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block font-heading font-semibold leading-snug transition-colors group-hover:text-violet dark:group-hover:text-primary">{s.title}</span>
                    <span className="block text-sm text-muted-foreground">{s.categoryName}</span>
                    <span className="flex flex-wrap items-center gap-x-3 pt-1 text-sm">
                      <span className="font-semibold tabular-nums">
                        From <bdi dir="ltr" className="text-brand-gradient font-bold">{formatPrice(s.price)}</bdi>
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
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <StaggerItem key={c.id} lift>
                <CategoryTile category={{ ...c, serviceCount: 0 }} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
        <div className="mt-8 flex justify-center md:mt-10">
          <Button variant="outline" size="lg" render={<Link href={services.length ? "/services" : "/category"} />}>
            {services.length ? "All services" : "All categories"}
            <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  )
}
