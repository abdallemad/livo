import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProviderReview } from "@/components/admin/providers/ProviderReview"
import { getProviderDetail } from "@/services/provider-review.service"

/**
 * /admin/providers/[id] — review one provider (docs/SITEMAP.md §5, AD-01). The first
 * snapshot is read on the server (service called directly — CLAUDE.md §2 exception; the
 * admin layout already enforced the role) and handed to the client as `initialData`;
 * decisions go through `PATCH /api/admin/providers/[id]/status` and refetch it.
 */
const load = cache(getProviderDetail)

export async function generateMetadata({ params }: PageProps<"/admin/providers/[id]">): Promise<Metadata> {
  const provider = await load((await params).id)
  return { title: provider ? `Review ${provider.name}` : "Provider not found" }
}

export default async function AdminProviderReviewPage({ params }: PageProps<"/admin/providers/[id]">) {
  const provider = await load((await params).id)
  if (!provider) notFound()
  return <ProviderReview initialData={provider} />
}
