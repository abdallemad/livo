import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { bookingListQuerySchema } from "@/schemas/admin.schema"
import { listBookingsForAdmin } from "@/services/admin-booking.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/bookings?status=&source=&q=&page= — every booking with status counts (AD-04). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, bookingListQuerySchema)
    return ok(await listBookingsForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load bookings.")
  }
}
