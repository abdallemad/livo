import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryView } from "@/components/catalog/CategoryView"
import { getCategoryPaths } from "@/services/catalog.service"
import { categoryMetadata, loadCategoryPage } from "./load"

/**
 * /services/[category] — a category page (docs/SITEMAP.md §2, MK-02, docs/catalog-feature.md). SSG: every active
 * category slug is prerendered (CLAUDE.md §4.1 rule 6); a category added later renders on first visit and is
 * cached (`dynamicParams` default). Refreshed hourly and by `revalidateStorefront()`.
 */
export const revalidate = 3600

export async function generateStaticParams() {
  return (await getCategoryPaths()).map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: PageProps<"/services/[category]">): Promise<Metadata> {
  return categoryMetadata(await loadCategoryPage((await params).category, 1))
}

export default async function ServicesCategoryPage({ params }: PageProps<"/services/[category]">) {
  const data = await loadCategoryPage((await params).category, 1)
  if (!data) notFound()
  return <CategoryView data={data} />
}
