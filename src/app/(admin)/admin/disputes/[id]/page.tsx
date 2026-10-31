import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DisputeDetail } from "@/components/admin/moderation/DisputeDetail"
import { getDisputeForAdmin } from "@/services/dispute.service"

/**
 * /admin/disputes/[id] — review evidence and decide (AD-05). First snapshot read on the server
 * (service called directly — CLAUDE.md §2 exception; the admin layout enforced the role) and handed
 * to the client as `initialData`; decisions go through `PATCH /api/admin/disputes/[id]/status`.
 */
const load = cache(getDisputeForAdmin)

export async function generateMetadata({ params }: PageProps<"/admin/disputes/[id]">): Promise<Metadata> {
  const dispute = await load((await params).id)
  return { title: dispute ? `Dispute on ${dispute.bookingNumber}` : "Dispute not found" }
}

export default async function AdminDisputeDetailPage({ params }: PageProps<"/admin/disputes/[id]">) {
  const dispute = await load((await params).id)
  if (!dispute) notFound()
  return <DisputeDetail initialData={dispute} />
}
