"use client"

import Link from "next/link"
import { AlertCircle, SearchX, SlidersHorizontal, X } from "lucide-react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { EmptyState } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useCatalogServices } from "@/hooks/use-catalog"
import { useUrlQuery } from "@/hooks/use-url-query"
import { catalogQuerySchema, type CatalogQuery } from "@/schemas/catalog.schema"
import type { CatalogFilterOptions, CatalogServicePage } from "@/types/catalog"
import { activeFilterCount, CATALOG_SORT_LABEL, CATALOG_SORTS, durationLabel } from "@/utils/catalog"
import { formatNumber, formatPrice } from "@/utils/format"
import { FilterPanel, type FilterPatch } from "./FilterPanel"
import { ServiceGrid } from "./ServiceGrid"

const SORT_OPTIONS = CATALOG_SORTS.map((s) => ({ id: s, name: CATALOG_SORT_LABEL[s] }))
const DEFAULT_QUERY = catalogQuerySchema.parse({})

/** Removable chips for the filters that are on. */
function ActiveChips({ query, options, onChange }: { query: CatalogQuery; options: CatalogFilterOptions; onChange: (p: FilterPatch) => void }) {
  const chips: { key: string; label: string; clear: FilterPatch }[] = []
  if (query.q) chips.push({ key: "q", label: `“${query.q}”`, clear: { q: undefined } })
  if (query.category) chips.push({ key: "category", label: options.categories.find((c) => c.slug === query.category)?.name ?? query.category, clear: { category: undefined } })
  if (query.area) chips.push({ key: "area", label: options.areas.find((a) => a.slug === query.area)?.name ?? query.area, clear: { area: undefined } })
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const label = query.minPrice !== undefined && query.maxPrice !== undefined ? `${formatPrice(query.minPrice)} – ${formatPrice(query.maxPrice)}` : query.minPrice !== undefined ? `From ${formatPrice(query.minPrice)}` : `Up to ${formatPrice(query.maxPrice!)}`
    chips.push({ key: "price", label, clear: { minPrice: undefined, maxPrice: undefined } })
  }
  if (query.maxDuration !== undefined) chips.push({ key: "duration", label: `≤ ${durationLabel(query.maxDuration)}`, clear: { maxDuration: undefined } })
  if (query.minRating !== undefined) chips.push({ key: "rating", label: `${query.minRating}+ ★`, clear: { minRating: undefined } })
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <Badge key={c.key} variant="secondary" className="h-8 gap-1 ps-3 pe-1 text-sm">
          {c.label}
          <button type="button" className="rounded-full p-0.5 hover:bg-background" aria-label={`Remove ${c.label}`} onClick={() => onChange(c.clear)}>
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ))}
      <Button size="sm" variant="ghost" onClick={() => onChange({ q: undefined, category: undefined, area: undefined, minPrice: undefined, maxPrice: undefined, maxDuration: undefined, minRating: undefined })}>
        Clear all
      </Button>
    </div>
  )
}

interface LayoutProps {
  query: CatalogQuery
  options: CatalogFilterOptions
  onChange: (p: FilterPatch) => void
  results: React.ReactNode
  total: number | null
  busy?: boolean
}

/** Sidebar + toolbar + results. Shared by the live island and the static Suspense fallback (same markup). */
function BrowserLayout({ query, options, onChange, results, total, busy }: LayoutProps) {
  const count = activeFilterCount(query)
  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      <aside aria-label="Filters" className="hidden lg:block">
        <FilterPanel query={query} options={options} onChange={onChange} className="sticky top-24" />
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="h-11 lg:hidden" />}>
              <SlidersHorizontal data-icon="inline-start" aria-hidden />
              Filters{count ? ` (${count})` : ""}
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterPanel query={query} options={options} onChange={onChange} className="px-4 pb-6" />
            </SheetContent>
          </Sheet>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total === null ? "Loading…" : `${formatNumber(total)} ${total === 1 ? "service" : "services"}`}
          </p>
          {busy ? <Spinner className="text-muted-foreground" /> : null}
          <div className="ms-auto w-52 [&_[data-slot=select-trigger]]:h-11">
            <OptionSelect id="catalog-sort" value={query.sort} onChange={(v) => onChange({ sort: v === "recommended" ? undefined : v })} options={SORT_OPTIONS} placeholder="Sort" />
          </div>
        </div>
        <ActiveChips query={query} options={options} onChange={onChange} />
        {results}
      </div>
    </div>
  )
}

/**
 * `/services` advanced search (MK-02, MK-06; docs/catalog-feature.md). Filters live in the URL so a filtered
 * view can be shared; the page itself stays static and the proxy marks `/services?…` noindex. Results for
 * the default view come from the server (`initial`); anything else from `GET /api/services`.
 */
export function ServiceBrowser({ initial, options }: { initial: CatalogServicePage; options: CatalogFilterOptions }) {
  const { query, hrefWith, setQuery } = useUrlQuery(catalogQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useCatalogServices(query, initial)
  const onChange = (patch: FilterPatch) => setQuery(patch)

  const results = isError ? (
    <EmptyState icon={AlertCircle} title="Couldn't load services" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
  ) : isPending ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/5] w-full" />
      ))}
    </div>
  ) : data.items.length === 0 ? (
    <EmptyState
      icon={SearchX}
      title="No services match"
      description="Try fewer filters — or describe the job and let providers send you quotes."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" render={<Link href="/services" />}>Clear filters</Button>
          <Button render={<Link href="/account/requests/new" />}>Request a quote</Button>
        </div>
      }
    />
  ) : (
    <>
      <ServiceGrid items={data.items} />
      {data.pageCount > 1 ? <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} /> : null}
    </>
  )

  return <BrowserLayout query={query} options={options} onChange={onChange} results={results} total={data?.total ?? null} busy={isFetching && !isPending} />
}

/**
 * Suspense fallback (CLAUDE.md §4.1 rule 8): the SAME markup with no filter selected and the server-rendered
 * default results, so crawlers and the first paint get every service link before the island hydrates.
 */
export function ServiceBrowserFallback({ initial, options }: { initial: CatalogServicePage; options: CatalogFilterOptions }) {
  return (
    <BrowserLayout
      query={DEFAULT_QUERY}
      options={options}
      onChange={() => {}}
      total={initial.total}
      results={
        initial.items.length ? (
          <ServiceGrid items={initial.items} />
        ) : (
          <EmptyState icon={SearchX} title="No fixed-price services yet" description="Describe the job and let providers send you quotes." />
        )
      }
    />
  )
}
