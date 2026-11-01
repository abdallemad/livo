import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { ServiceForm } from "@/components/provider/services/ServiceForm"
import { getServiceFormData } from "@/services/provider-catalog.service"

/**
 * /provider/services/[id]/edit — edit one of the provider's services (docs/SITEMAP.md §4, PR-05).
 * Someone else's service is a 404. Saves via `PUT /api/provider/services/[id]`; on/off and delete
 * are on the list page.
 */
const load = cache(async (id: string) => {
  const { userId } = await auth()
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/provider/services/${id}/edit`)}`)
  return getServiceFormData(userId, id)
})

export async function generateMetadata({ params }: PageProps<"/provider/services/[id]/edit">): Promise<Metadata> {
  const data = await load((await params).id)
  return { title: data?.service ? `Edit ${data.service.title}` : "Service not found" }
}

export default async function EditProviderServicePage({ params }: PageProps<"/provider/services/[id]/edit">) {
  const data = await load((await params).id)
  if (!data?.service) notFound()
  return <ServiceForm data={data} />
}
