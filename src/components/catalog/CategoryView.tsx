import Link from "next/link"
import { ClipboardList, SlidersHorizontal, Wrench } from "lucide-react"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { JsonLd } from "@/components/seo/json-ld"
import { EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SITE_NAME } from "@/constants/site"
import type { CategoryPageData } from "@/types/catalog"
import { CATEGORIES_PATH, categoryPageHref } from "@/utils/catalog"
import { formatNumber } from "@/utils/format"
import { breadcrumbJsonLd, serviceListJsonLd } from "@/utils/structured-data"
import { Crumbs } from "./Crumbs"
import { ServiceGrid } from "./ServiceGrid"

/** The crumbs for a category page — shared by the visible breadcrumb and the JSON-LD. */
export function categoryCrumbs(d: CategoryPageData) {
  const page = d.services.page
  return [
    { name: "Home", path: "/" },
    { name: "Categories", path: CATEGORIES_PATH },
    ...(d.parent ? [{ name: d.parent.name, path: categoryPageHref(d.parent.slug) }] : []),
    { name: d.category.name, path: categoryPageHref(d.category.slug) },
    ...(page > 1 ? [{ name: `Page ${page}`, path: categoryPageHref(d.category.slug, page) }] : []),
  ]
}

/**
 * `/services/[category]` and `/services/[category]/page/[page]` (MK-02; docs/catalog-feature.md): server-rendered,
 * static. Breadcrumb + JSON-LD, the category's copy, sub-category links, the fixed-price services as real links,
 * real pagination links, and the "request a quote" path for categories that take quotes (SRS 2.2).
 */
export function CategoryView({ data }: { data: CategoryPageData }) {
  const { category: c, services } = data
  const crumbs = categoryCrumbs(data)
  const takesQuotes = c.type !== "FIXED"
  const requestHref = `/account/requests/new?category=${encodeURIComponent(c.slug)}`

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-12">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {services.items.length ? <JsonLd data={serviceListJsonLd(`${c.name} services`, services.items)} /> : null}
      <Crumbs crumbs={crumbs} />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold md:text-4xl">
          {c.name}
          {services.page > 1 ? <span className="text-muted-foreground"> — page {services.page}</span> : null}
        </h1>
        {c.description ? <p className="max-w-prose text-lg text-muted-foreground">{c.description}</p> : null}
        <p className="text-sm text-muted-foreground">
          {formatNumber(services.total)} fixed-price {services.total === 1 ? "service" : "services"} · {formatNumber(data.providerCount)} verified{" "}
          {data.providerCount === 1 ? "provider" : "providers"}
        </p>
        {c.children.length ? (
          <nav aria-label={`${c.name} categories`} className="flex flex-wrap gap-2 pt-1">
            {c.children.map((k) => (
              <Button key={k.slug} variant="outline" size="sm" render={<Link href={categoryPageHref(k.slug)} />}>
                {k.name}
                {k.serviceCount ? <span className="text-muted-foreground tabular-nums">{formatNumber(k.serviceCount)}</span> : null}
              </Button>
            ))}
          </nav>
        ) : null}
      </header>

      {takesQuotes ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="block font-semibold">{c.type === "QUOTE" ? `${c.name} jobs are priced by quote` : "Need something bigger or custom?"}</span>
              <span className="text-sm text-muted-foreground">Describe the job with photos and verified providers send you their prices to compare.</span>
            </p>
            <Button size="lg" render={<Link href={requestHref} />}>
              <ClipboardList data-icon="inline-start" aria-hidden />
              Request a quote
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="services-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="services-heading" className="text-xl font-semibold">
            Fixed-price {c.name.toLowerCase()} services
          </h2>
          {services.total > 0 ? (
            <Button variant="ghost" render={<Link href={`/services?category=${encodeURIComponent(c.slug)}`} />}>
              <SlidersHorizontal data-icon="inline-start" aria-hidden />
              Filter by price, area, rating
            </Button>
          ) : null}
        </div>
        {services.items.length ? (
          <>
            <ServiceGrid items={services.items} />
            {services.pageCount > 1 ? (
              <ListPagination page={services.page} pageCount={services.pageCount} total={services.total} hrefFor={(p) => categoryPageHref(c.slug, p)} />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Wrench}
            title={`No fixed-price ${c.name.toLowerCase()} services yet`}
            description={takesQuotes ? "Request a quote and providers in your area will send you their prices." : `Check back soon, or browse other ${SITE_NAME} services.`}
            action={takesQuotes ? <Button render={<Link href={requestHref} />}>Request a quote</Button> : <Button variant="outline" render={<Link href="/services" />}>Browse all services</Button>}
          />
        )}
      </section>
    </div>
  )
}
