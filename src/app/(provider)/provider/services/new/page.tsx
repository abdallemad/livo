import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { ServiceForm } from "@/components/provider/services/ServiceForm"
import { getServiceFormData } from "@/services/provider-catalog.service"

/** /provider/services/new — add a fixed-price service (docs/SITEMAP.md §4, PR-05). Saves via `POST /api/provider/services`. */
export const metadata: Metadata = { title: "Add a service" }

export default async function NewProviderServicePage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider%2Fservices%2Fnew")
  const data = await getServiceFormData(userId)
  if (!data) notFound()
  if (data.categories.length === 0) redirect("/provider/services") // quote-only trades: the list explains why
  return <ServiceForm data={data} />
}
