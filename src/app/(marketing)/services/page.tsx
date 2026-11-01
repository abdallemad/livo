import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, LayoutGrid } from "lucide-react"
import { Crumbs } from "@/components/catalog/Crumbs"
import { ServiceBrowser, ServiceBrowserFallback } from "@/components/catalog/ServiceBrowser"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { getCatalogIndex } from "@/services/catalog.service"
import { CATEGORIES_PATH } from "@/utils/catalog"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd } from "@/utils/structured-data"

/**
 * /services — all fixed-price services with advanced filters (docs/SITEMAP.md §2, MK-02, MK-06;
 * docs/catalog-feature.md). Categories have their own page, `/category`. STATIC (ISR, hourly; `revalidateStorefront()` refreshes it after catalog
 * writes): the page never reads `searchParams`. Filter options and the default listing are rendered from the DB at
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
  const { options, initial } = await getCatalogIndex()
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Crumbs crumbs={CRUMBS} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold md:text-4xl">All services</h1>
          <p className="max-w-prose text-lg text-muted-foreground">Book a fixed-price job from a verified provider, or describe a bigger project and compare quotes.</p>
        </div>
        <Button variant="outline" size="lg" render={<Link href={CATEGORIES_PATH} />}>
          <LayoutGrid data-icon="inline-start" aria-hidden />
          Browse categories
        </Button>
      </header>

      <section aria-label="Fixed-price services" className="space-y-4">
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
