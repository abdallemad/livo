import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { providerBookingListQuerySchema } from "@/schemas/provider.schema"
import { requireProvider } from "@/services/auth.service"
import { listBookingsForProvider } from "@/services/provider-booking.service"

/** GET /api/provider/bookings?tab=&q=&page= — the signed-in provider's bookings (PR-08). */
export async function GET(request: Request) {
  try {
    const user = await requireProvider()
    const query = parseQuery(request, providerBookingListQuerySchema)
    return ok(await listBookingsForProvider(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your bookings.")
  }
}
