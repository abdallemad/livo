import { ok, toErrorResponse } from "@/lib/api-route"
import { requireProvider } from "@/services/auth.service"
import { getProviderDashboard } from "@/services/provider-dashboard.service"

/** GET /api/provider/dashboard — the signed-in provider's home data (PR-14, PR-03). */
export async function GET() {
  try {
    const user = await requireProvider()
    return ok(await getProviderDashboard(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your dashboard.")
  }
}
