import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { CategoryView } from "@/components/catalog/CategoryView"
import { getCategoryPaths } from "@/services/catalog.service"
import { categoryPageHref, parsePageSegment } from "@/utils/catalog"
import { notFoundMetadata } from "@/utils/seo-metadata"
import { categoryMetadata, loadCategoryPage } from "../../load"

/**
 * /services/[category]/page/[page] — page 2+ of a category (docs/SITEMAP.md §2, MK-02, docs/catalog-feature.md).
 * SSG for every existing page; `/page/1` → 308 to the clean URL; malformed or past-the-end → 404 (CLAUDE.md §11).
 */
export const revalidate = 3600

export async function generateStaticParams() {
  const paths = await getCategoryPaths()
  return paths.flatMap((c) => Array.from({ length: Math.max(0, c.pageCount - 1) }, (_, i) => ({ category: c.slug, page: String(i + 2) })))
}

async function load(params: PageProps<"/services/[category]/page/[page]">["params"]) {
  const { category, page: raw } = await params
  const page = parsePageSegment(raw)
  if (page === "redirect") permanentRedirect(categoryPageHref(category))
  if (page === "notFound") return null
  const data = await loadCategoryPage(category, page)
  return data && page <= data.services.pageCount ? data : null
}

export async function generateMetadata({ params }: PageProps<"/services/[category]/page/[page]">): Promise<Metadata> {
  const data = await load(params)
  return data ? categoryMetadata(data) : notFoundMetadata()
}

export default async function ServicesCategoryPagedPage({ params }: PageProps<"/services/[category]/page/[page]">) {
  const data = await load(params)
  if (!data) notFound()
  return <CategoryView data={data} />
}
