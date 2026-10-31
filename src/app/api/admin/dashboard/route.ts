import { ok, toErrorResponse } from "@/lib/api-route"
import { getAdminDashboard } from "@/services/admin-dashboard.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/dashboard — KPIs + work queues for `/admin` (AD-09). Refetched after every dashboard action. */
export async function GET() {
  try {
    await requireAdmin()
    return ok(await getAdminDashboard(), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the dashboard.")
  }
}
