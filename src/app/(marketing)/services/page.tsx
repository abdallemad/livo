import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { CategoryTile } from "@/components/catalog/CategoryTile"
import { Crumbs } from "@/components/catalog/Crumbs"
import { ServiceBrowser, ServiceBrowserFallback } from "@/components/catalog/ServiceBrowser"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { getCatalogIndex } from "@/services/catalog.service"
import { categoryPageHref } from "@/utils/catalog"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd, categoryListJsonLd } from "@/utils/structured-data"

/**
 * /services — every category + all fixed-price services with advanced filters (docs/SITEMAP.md §2, MK-02,
 * MK-06; docs/catalog-feature.md). STATIC (ISR, hourly; `revalidateStorefront()` refreshes it after catalog
 * writes): the page never reads `searchParams`. Categories and the default listing are rendered from the DB at
 * build / regeneration and handed to the filter island as `initialData`; filters live in the URL and are read
 * by the island (`useSearchParams` → Suspense, fallback = same markup, no filter). `/services?…` is noindex (proxy).
 */
export const revalidate = 3600

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
]

export const metadata: Metadata = pageMetadata({
  title: "All services",
  description: "Plumbing, electrical, cleaning, painting and finishing by verified providers. Book a fixed-price service or request quotes for a bigger job.",
  path: "/services",
})

export default async function ServicesPage() {
  const { categories, options, initial } = await getCatalogIndex()
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={categoryListJsonLd(categories.map((c) => ({ name: c.name, path: categoryPageHref(c.slug) })))} />
      <Crumbs crumbs={CRUMBS} />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold md:text-4xl">All services</h1>
        <p className="max-w-prose text-lg text-muted-foreground">Book a fixed-price job from a verified provider, or describe a bigger project and compare quotes.</p>
      </header>

      <section aria-labelledby="categories-heading" className="space-y-4">
        <h2 id="categories-heading" className="text-xl font-semibold">Browse by category</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <CategoryTile category={c} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="browse-heading" className="space-y-4">
        <h2 id="browse-heading" className="text-xl font-semibold">Fixed-price services</h2>
        <Suspense fallback={<ServiceBrowserFallback initial={initial} options={options} />}>
          <ServiceBrowser initial={initial} options={options} />
        </Suspense>
      </section>

      <section className="flex flex-col items-start gap-3 rounded-2xl border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="block font-heading text-lg font-semibold">Can&apos;t find what you need?</span>
          <span className="text-muted-foreground">Describe the job with photos — verified providers send you their prices.</span>
        </p>
        <Button size="lg" render={<Link href="/account/requests/new" />}>
          <ClipboardList data-icon="inline-start" aria-hidden />
          Request a quote
        </Button>
      </section>
    </div>
  )
}
