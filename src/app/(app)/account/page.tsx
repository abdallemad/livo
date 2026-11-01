import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CustomerDashboard } from "@/components/customer/dashboard/CustomerDashboard"
import { getCustomerDashboard } from "@/services/customer.service"

/**
 * /account — customer home (docs/SITEMAP.md §3, CU-08, docs/customer-dashboard-requests-feature.md).
 * First snapshot read on the server by calling the service directly for the session's own user id
 * (CLAUDE.md §2 exception; the zone layout enforces the role) and handed to the client island as
 * `initialData`; it refetches from `GET /api/me/dashboard`. Private: `noindex` from the layout.
 */
export const metadata: Metadata = { title: "My account" }

export default async function CustomerDashboardPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Faccount")
  return <CustomerDashboard initialData={await getCustomerDashboard(userId)} />
}
