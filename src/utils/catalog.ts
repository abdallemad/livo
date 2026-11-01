/**
 * The public catalog (MK-02, MK-06; docs/catalog-feature.md) — pure URL and filter rules, tested.
 * Category URLs are SSG pages with real pagination links; filtered views of `/services` are client-side,
 * noindex, and never change the static HTML (CLAUDE.md §4.1 rules 6–7, §11).
 */

export const CATALOG_PAGE_SIZE = 12
/** Cap for crawlable page numbers, so stray links can't create unbounded pages (CLAUDE.md §4.1 rule 7). */
export const MAX_CATALOG_PAGE = 1000

export const CATALOG_SORTS = ["recommended", "price_asc", "price_desc", "rating", "newest"] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]
export const CATALOG_SORT_LABEL: Record<CatalogSort, string> = {
  recommended: "Recommended",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Best rated",
  newest: "Newest",
}

export const DURATION_FILTERS = [60, 120, 240] as const
export const RATING_FILTERS = [3, 4, 4.5] as const

export interface CatalogFilters {
  q?: string
  category?: string
  area?: string
  minPrice?: number
  maxPrice?: number
  maxDuration?: number
  minRating?: number
  sort: CatalogSort
  page: number
}

/** `/services/<slug>` for page 1, `/services/<slug>/page/<n>` after — the one URL rule for category listings. */
export function categoryPageHref(slug: string, page = 1) {
  return page <= 1 ? `/services/${slug}` : `/services/${slug}/page/${page}`
}

/**
 * The `[page]` segment of `/services/<slug>/page/<page>`: a whole number 2..MAX, written canonically.
 * `1` → "redirect" (to the clean URL), anything else malformed → "notFound".
 */
export function parsePageSegment(raw: string): number | "redirect" | "notFound" {
  if (!/^[1-9]\d*$/.test(raw)) return "notFound"
  const n = Number(raw)
  if (n === 1) return "redirect"
  return n > MAX_CATALOG_PAGE ? "notFound" : n
}

/** A min above the max is a slip of the thumb — swap instead of showing nothing. */
export function normalizePriceRange(min?: number, max?: number) {
  if (min !== undefined && max !== undefined && min > max) return { minPrice: max, maxPrice: min }
  return { minPrice: min, maxPrice: max }
}

/** How many filters are on (sort and page aren't filters) — the badge on the mobile "Filters" button. */
export function activeFilterCount(f: CatalogFilters) {
  return [f.q, f.category, f.area, f.minPrice, f.maxPrice, f.maxDuration, f.minRating].filter((v) => v !== undefined && v !== "").length
}

/** `/services?…` for a set of filters, dropping defaults (sort=recommended, page=1). */
export function catalogHref(f: Partial<CatalogFilters>) {
  const p = new URLSearchParams()
  const set = (k: string, v: string | number | undefined) => {
    if (v !== undefined && v !== "") p.set(k, String(v))
  }
  set("q", f.q)
  set("category", f.category)
  set("area", f.area)
  set("minPrice", f.minPrice)
  set("maxPrice", f.maxPrice)
  set("maxDuration", f.maxDuration)
  set("minRating", f.minRating)
  if (f.sort && f.sort !== "recommended") p.set("sort", f.sort)
  if (f.page && f.page > 1) p.set("page", String(f.page))
  const qs = p.toString()
  return qs ? `/services?${qs}` : "/services"
}

/** "1 hour", "2 hours", "45 min". */
export function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = minutes / 60
  return Number.isInteger(h) ? `${h} ${h === 1 ? "hour" : "hours"}` : `${h.toFixed(1)} hours`
}
