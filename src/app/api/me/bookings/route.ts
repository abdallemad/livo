import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { customerBookingListQuerySchema } from "@/schemas/customer-account.schema"
import { requireUser } from "@/services/auth.service"
import { listMyBookings } from "@/services/customer-account.service"

/** GET /api/me/bookings?tab=&q=&page= — the signed-in customer's bookings with the next step for each (CU-13). */
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const query = parseQuery(request, customerBookingListQuerySchema)
    return ok(await listMyBookings(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your bookings.")
  }
}
