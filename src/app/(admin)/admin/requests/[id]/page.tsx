import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { RequestDetail } from "@/components/admin/orders/RequestDetail"
import { getRequestForAdmin } from "@/services/admin-request.service"

/**
 * /admin/requests/[id] — one request with its quotes (AD-04). First snapshot read on the server
 * (service called directly — CLAUDE.md §2 exception; the admin layout enforced the role) and handed
 * to the client as `initialData`; closing it goes through `PATCH /api/admin/requests/[id]/status`.
 */
const load = cache(getRequestForAdmin)

export async function generateMetadata({ params }: PageProps<"/admin/requests/[id]">): Promise<Metadata> {
  const request = await load((await params).id)
  return { title: request ? request.title : "Request not found" }
}

export default async function AdminRequestDetailPage({ params }: PageProps<"/admin/requests/[id]">) {
  const request = await load((await params).id)
  if (!request) notFound()
  return <RequestDetail initialData={request} />
}
