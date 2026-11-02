import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { ProviderRequestDetail } from "@/components/provider/requests/ProviderRequestDetail"
import { getRequestForProvider } from "@/services/provider-request.service"

/**
 * /provider/requests/[id] — one request and my quote on it (docs/SITEMAP.md §4, PR-07,
 * docs/provider-request-detail-feature.md). First snapshot read on the server (service called directly for the session's
 * own user id — CLAUDE.md §2 exception); sending goes through `PUT /api/provider/requests/[id]/quote`. A request that
 * doesn't match me and that I never quoted is a 404. Private: `noindex` from the zone layout.
 */
const load = cache(async (id: string) => {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/provider/requests/${id}`)}`)
  return getRequestForProvider(userId, id.slice(0, 64))
})

export async function generateMetadata({ params }: PageProps<"/provider/requests/[id]">): Promise<Metadata> {
  const request = await load((await params).id)
  return { title: request ? request.title : "Request not found" }
}

export default async function ProviderRequestDetailPage({ params }: PageProps<"/provider/requests/[id]">) {
  const request = await load((await params).id)
  if (!request) notFound()
  return <ProviderRequestDetail initialData={request} />
}
