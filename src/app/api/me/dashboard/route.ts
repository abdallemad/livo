import { ok, toErrorResponse } from "@/lib/api-route"
import { requireUser } from "@/services/auth.service"
import { getCustomerDashboard } from "@/services/customer.service"

/** GET /api/me/dashboard — the signed-in customer's home: counts, things to act on, upcoming bookings, open requests (CU-08). */
export async function GET() {
  try {
    const user = await requireUser()
    return ok(await getCustomerDashboard(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your dashboard.")
  }
}
