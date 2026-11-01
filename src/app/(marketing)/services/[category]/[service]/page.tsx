import { cache } from "react"
import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { ServiceDetailView } from "@/components/catalog/ServiceDetailView"
import { getServiceDetail } from "@/services/catalog.service"
import { durationLabel, metaExcerpt } from "@/utils/catalog"
import { formatPrice } from "@/utils/format"
import { notFoundMetadata, pageMetadata } from "@/utils/seo-metadata"

/**
 * /services/[category]/[service] — a fixed-price service (docs/SITEMAP.md §2, MK-02, docs/catalog-feature.md).
 * ISR with an empty `generateStaticParams`: rendered on first visit, then cached for an hour (CLAUDE.md §4.1
 * rule 5) and refreshed by `revalidateStorefront()` after any catalog write. Only LIVE services render; a service
 * that moved category answers 308 to its new URL; anything else is a 404.
 */
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

const load = cache(getServiceDetail)

async function resolve(params: PageProps<"/services/[category]/[service]">["params"]) {
  const { category, service } = await params
  const result = await load(category, service)
  if (result.kind === "moved") permanentRedirect(result.href)
  return result.kind === "found" ? result.service : null
}

export async function generateMetadata({ params }: PageProps<"/services/[category]/[service]">): Promise<Metadata> {
  const s = await resolve(params)
  if (!s) return notFoundMetadata()
  const facts = [formatPrice(s.price), s.durationMinutes ? durationLabel(s.durationMinutes) : null, s.provider.name].filter(Boolean).join(" · ")
  return pageMetadata({ title: `${s.title} — ${formatPrice(s.price)}`, description: metaExcerpt(`${facts}. ${s.description}`), path: s.href })
}

export default async function ServiceDetailPage({ params }: PageProps<"/services/[category]/[service]">) {
  const s = await resolve(params)
  if (!s) notFound()
  return <ServiceDetailView s={s} />
}
