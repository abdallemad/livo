import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProviderProfileView } from "@/components/catalog/ProviderProfileView"
import { getPublicProviderProfile } from "@/services/public-provider.service"
import { metaExcerpt } from "@/utils/catalog"
import { profileMetaDescription, specialtiesPhrase } from "@/utils/provider-profile"
import { notFoundMetadata, pageMetadata } from "@/utils/seo-metadata"

/**
 * /providers/[id] — the public provider profile (docs/SITEMAP.md §2, PR-04, PR-10, SY-04, docs/provider-profile-feature.md).
 * ISR with an empty `generateStaticParams`: rendered on first visit, cached for an hour (CLAUDE.md §4.1 rule 5) and
 * refreshed by `revalidateStorefront()` after provider/admin writes. Only approved providers with an active account
 * render; anyone else is a 404. Never shows contact details.
 */
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

const load = cache(getPublicProviderProfile)

export async function generateMetadata({ params }: PageProps<"/providers/[id]">): Promise<Metadata> {
  const p = await load((await params).id)
  if (!p) return notFoundMetadata()
  const names = p.specialties.map((s) => s.name)
  const what = specialtiesPhrase(names)
  return pageMetadata({
    title: what ? `${p.name} — ${what} in ${p.city}` : `${p.name} — verified provider in ${p.city}`,
    description: metaExcerpt(profileMetaDescription({ name: p.name, specialties: names, city: p.city, completedJobs: p.completedJobs, yearsExperience: p.yearsExperience })),
    path: p.href,
  })
}

export default async function ProviderProfilePage({ params }: PageProps<"/providers/[id]">) {
  const p = await load((await params).id)
  if (!p) notFound()
  return <ProviderProfileView p={p} />
}
