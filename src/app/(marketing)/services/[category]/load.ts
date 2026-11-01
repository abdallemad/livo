import "server-only"
import { cache } from "react"
import type { Metadata } from "next"
import { getCategoryPage } from "@/services/catalog.service"
import type { CategoryPageData } from "@/types/catalog"
import { categoryPageHref } from "@/utils/catalog"
import { notFoundMetadata, pageMetadata } from "@/utils/seo-metadata"

/**
 * Shared by `/services/[category]` and `/services/[category]/page/[page]`: one cached read per request, so
 * `generateMetadata` and the page share it (CLAUDE.md §4.1 rule 10). docs/catalog-feature.md.
 */
export const loadCategoryPage = cache((slug: string, page: number) => getCategoryPage(slug, page))

/** Page N ≥ 2 is self-canonical with "Page N" in the title (CLAUDE.md §11). */
export function categoryMetadata(data: CategoryPageData | null): Metadata {
  if (!data) return notFoundMetadata()
  const { category: c, parent, services } = data
  const page = services.page
  const base = parent ? `${c.name} — ${parent.name} services` : `${c.name} services`
  const title = page > 1 ? `${base} — Page ${page}` : base
  const description =
    c.description ??
    (c.type === "QUOTE"
      ? `Request quotes for ${c.name.toLowerCase()} from verified providers and compare prices.`
      : `Book fixed-price ${c.name.toLowerCase()} services from verified providers, or request a quote for a bigger job.`)
  return pageMetadata({ title, description, path: categoryPageHref(c.slug, page) })
}
