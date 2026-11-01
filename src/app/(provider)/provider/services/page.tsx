import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ServicesList } from "@/components/provider/services/ServicesList"
import { listServicesForProvider } from "@/services/provider-catalog.service"

/**
 * /provider/services — the provider's fixed-price services (docs/SITEMAP.md §4, PR-05,
 * docs/provider-services-portfolio-feature.md). First snapshot read on the server (service called
 * directly for the session's own user id — CLAUDE.md §2 exception); switches and deletes go through
 * `/api/provider/services/*`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "My services" }

export default async function ProviderServicesPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider%2Fservices")
  return <ServicesList initialData={await listServicesForProvider(userId)} />
}
