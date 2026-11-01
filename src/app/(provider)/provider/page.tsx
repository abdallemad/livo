import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ProviderDashboard } from "@/components/provider/dashboard/ProviderDashboard"
import { getProviderDashboard } from "@/services/provider-dashboard.service"

/**
 * /provider — provider home (docs/SITEMAP.md §4, PR-14, PR-03, docs/provider-dashboard-requests-feature.md).
 * The first snapshot is read on the server by calling the service directly (CLAUDE.md §2 exception;
 * the zone layout already enforced the role) for the session's own user id, and handed to the client
 * island as `initialData`; it refetches from `GET /api/provider/dashboard`. Private: `noindex` from the layout.
 */
export const metadata: Metadata = { title: "Provider dashboard" }

export default async function ProviderDashboardPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider")
  return <ProviderDashboard initialData={await getProviderDashboard(userId)} />
}
