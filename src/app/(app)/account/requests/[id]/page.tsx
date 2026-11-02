import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { MyRequestDetail } from "@/components/customer/requests/MyRequestDetail"
import { getMyRequest } from "@/services/customer-request.service"

/**
 * /account/requests/[id] — one of the customer's quote requests: stage, details, quotes to compare and accept
 * (docs/SITEMAP.md §3, CU-04, CU-05, CU-08, docs/customer-request-detail-feature.md). First snapshot read on the server
 * (service called directly for the session's own user id — CLAUDE.md §2 exception); accepting goes through
 * `POST /api/me/requests/[id]/booking`. Someone else's request is a 404. Private: `noindex` from the zone layout.
 */
const load = cache(async (id: string) => {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/account/requests/${id}`)}`)
  return getMyRequest(userId, id.slice(0, 64))
})

export async function generateMetadata({ params }: PageProps<"/account/requests/[id]">): Promise<Metadata> {
  const request = await load((await params).id)
  return { title: request ? request.title : "Request not found" }
}

export default async function AccountRequestDetailPage({ params }: PageProps<"/account/requests/[id]">) {
  const request = await load((await params).id)
  if (!request) notFound()
  return <MyRequestDetail initialData={request} />
}
