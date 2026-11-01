import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { StaticPageView } from "@/components/marketing/StaticPageView"
import { getPublishedPage } from "@/services/static-page.service"
import { metaExcerpt } from "@/utils/catalog"
import { notFoundMetadata, pageMetadata } from "@/utils/seo-metadata"

/**
 * /policies — backed by the `StaticPage` row with slug "policies" (docs/SITEMAP.md §2, MK-05, AD-10, docs/landing-page.md).
 * ISR (hourly + `revalidateStorefront()`); not published or missing → a graceful 404.
 */
export const revalidate = 3600

const load = cache(() => getPublishedPage("policies"))

export async function generateMetadata(): Promise<Metadata> {
  const page = await load()
  if (!page) return notFoundMetadata()
  const text = page.html.replace(/<[^>]+>/g, " ")
  return pageMetadata({ title: page.title, description: metaExcerpt(text) || "How bookings, payments, cancellations and disputes are handled.", path: "/policies" })
}

export default async function PoliciesPage() {
  const page = await load()
  if (!page) notFound()
  return <StaticPageView page={page} path="/policies" />
}
