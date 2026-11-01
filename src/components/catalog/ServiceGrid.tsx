import { ServiceCard } from "@/components/service/ServiceCard"
import type { CatalogServiceCard } from "@/types/catalog"
import { durationLabel } from "@/utils/catalog"

/** Grid of fixed-price service cards; each card is one real `<a>` to the service page (crawlable). */
export function ServiceGrid({ items }: { items: CatalogServiceCard[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <li key={s.id}>
          <ServiceCard
            service={{
              href: s.href,
              title: s.title,
              providerName: s.providerName,
              price: s.price,
              priceKind: "fixed",
              rating: s.reviewsCount ? s.rating : undefined,
              reviewsCount: s.reviewsCount || undefined,
              duration: s.durationMinutes ? durationLabel(s.durationMinutes) : undefined,
              imageUrl: s.imageUrl ?? undefined,
            }}
          />
        </li>
      ))}
    </ul>
  )
}
