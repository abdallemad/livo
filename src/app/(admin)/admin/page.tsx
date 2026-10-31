import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard"
import { getAdminDashboard } from "@/services/admin-dashboard.service"

/**
 * /admin — KPI dashboard (docs/SITEMAP.md §5, AD-09, docs/admin-dashboard-feature.md).
 * The first snapshot is read on the server by calling the service directly
 * (CLAUDE.md §2 exception; the admin layout already enforced the role) and
 * handed to the client island as `initialData`. Actions (approve / reject a
 * provider, start a dispute review) go through `/api/admin/*` and refetch it.
 */
export const metadata: Metadata = { title: "Dashboard" }

export default async function AdminDashboardPage() {
  return <AdminDashboard initialData={await getAdminDashboard()} />
}
