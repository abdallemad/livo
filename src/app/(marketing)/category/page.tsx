import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, Search } from "lucide-react"
import { CategoryTile } from "@/components/catalog/CategoryTile"
import { Crumbs } from "@/components/catalog/Crumbs"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { getCategoryDirectory } from "@/services/catalog.service"
import { CATEGORIES_PATH, categoryPageHref } from "@/utils/catalog"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd, categoryListJsonLd } from "@/utils/structured-data"

/**
 * /category — every service category (docs/SITEMAP.md §2, MK-02, docs/catalog-feature.md). Moved out of
 * `/services` so that page is only the filterable service list. STATIC (ISR, hourly; `revalidateStorefront()`
 * after catalog writes): read from the DB at build / regeneration, never from the request.
 */
export const revalidate = 3600

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Categories", path: CATEGORIES_PATH },
]

export const metadata: Metadata = pageMetadata({
  title: "Service categories",
  description: "Plumbing, electrical, cleaning, air conditioning, painting and finishing — find verified providers by category.",
  path: CATEGORIES_PATH,
})

export default async function CategoriesPage() {
  const { categories } = await getCategoryDirectory()
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={categoryListJsonLd(categories.map((c) => ({ name: c.name, path: categoryPageHref(c.slug) })))} />
      <Crumbs crumbs={CRUMBS} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold md:text-4xl">Service categories</h1>
          <p className="max-w-prose text-lg text-muted-foreground">Pick a trade to see its fixed-price services and verified providers, or request quotes for a bigger job.</p>
        </div>
        <Button variant="outline" size="lg" render={<Link href="/services" />}>
          <Search data-icon="inline-start" aria-hidden />
          Search all services
        </Button>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-col gap-2">
            <CategoryTile category={c} />
            {c.children.length ? (
              <ul className="flex flex-wrap gap-1.5 px-1" aria-label={`${c.name} categories`}>
                {c.children.map((k) => (
                  <li key={k.slug}>
                    <Button size="sm" variant="ghost" render={<Link href={categoryPageHref(k.slug)} />}>
                      {k.name}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      <section className="flex flex-col items-start gap-3 rounded-2xl border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="block font-heading text-lg font-semibold">Not sure which category?</span>
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
