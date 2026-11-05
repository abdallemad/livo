import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ServiceCard } from "@/components/service/ServiceCard"
import { Button } from "@/components/ui/button"
import type { CatalogCategory, CatalogServiceCard } from "@/types/catalog"
import { durationLabel } from "@/utils/catalog"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

/**
 * Popular fixed-price services (docs/landing-page.md §3) as spotlight cards (`ServiceCard`, docs/service-images-feature.md):
 * cover photo, category icon, title, blurb, "From $X" and duration; the first (most popular) wears "Most requested". Each
 * is a real link to the service page. Data: `getPopularServices` (LIVE services only). With no services yet, the real
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
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <StaggerItem key={s.id} className="h-full">
                <ServiceCard
                  badge={i === 0 ? "Most requested" : undefined}
                  service={{
                    href: s.href,
                    title: s.title,
                    description: s.summary,
                    iconKey: s.categoryIconKey,
                    price: s.price,
                    priceKind: "from",
                    duration: s.durationMinutes ? durationLabel(s.durationMinutes) : undefined,
                    imageUrl: s.imageUrl ?? undefined,
                  }}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <StaggerItem key={c.id} className="h-full">
                <ServiceCard
                  cta={c.type === "QUOTE" ? "Request quotes" : "Explore"}
                  service={{ href: `/services/${c.slug}`, title: c.name, description: c.description ?? undefined, iconKey: c.iconKey }}
                />
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
