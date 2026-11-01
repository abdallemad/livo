import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-url"
import { getCategoryPaths } from "@/services/catalog.service"
import { getPublicProviderPaths } from "@/services/public-provider.service"
import { getPublishedSlugs } from "@/services/static-page.service"
import { categoryPageHref } from "@/utils/catalog"

/**
 * Static entries (no lastModified) + DB entries. A DB outage degrades to the static list (try/catch + log), never a
 * 500. Refreshed hourly and by `revalidateStorefront()`. Filtered `/services?…` and `/search?…` views are noindex and
 * stay out (docs/catalog-feature.md). StaticPage-backed pages appear only when published, so the sitemap never lists
 * a 404 (docs/landing-page.md).
 */
export const revalidate = 3600

/** Always-200 public pages (docs/SITEMAP.md §2). `/search` is noindex and stays out. */
const STATIC_PATHS = ["/", "/services", "/category", "/how-it-works", "/become-provider", "/contact"]

/** Routes rendered from a `StaticPage` row of the same slug. */
const STATIC_PAGE_SLUGS = new Set(["about", "terms", "privacy", "faq", "policies"])

async function staticPageEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    return (await getPublishedSlugs()).filter((p) => STATIC_PAGE_SLUGS.has(p.slug)).map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt }))
  } catch (error) {
    console.error("[sitemap] static pages skipped (database unavailable)", error)
    return []
  }
}

/** Every category page and its numbered pages (MK-02). */
async function categoryEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const paths = await getCategoryPaths()
    return paths.flatMap((c) => Array.from({ length: c.pageCount }, (_, i) => ({ url: absoluteUrl(categoryPageHref(c.slug, i + 1)) })))
  } catch (error) {
    console.error("[sitemap] category entries skipped (database unavailable)", error)
    return []
  }
}

/** Public provider profiles (PR-04): approved providers with an active account only. */
async function providerEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    return (await getPublicProviderPaths()).map((p) => ({ url: absoluteUrl(p.path), lastModified: p.updatedAt }))
  } catch (error) {
    console.error("[sitemap] provider entries skipped (database unavailable)", error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, categories, providers] = await Promise.all([staticPageEntries(), categoryEntries(), providerEntries()])
  return [...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })), ...pages, ...categories, ...providers]
}
