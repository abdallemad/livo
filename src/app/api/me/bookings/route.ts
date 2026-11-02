import { created, ok, parseBody, parseQuery, toErrorResponse } from "@/lib/api-route"
import { createServiceBookingSchema } from "@/schemas/booking.schema"
import { customerBookingListQuerySchema } from "@/schemas/customer-account.schema"
import { requireUser } from "@/services/auth.service"
import { createServiceBooking } from "@/services/booking-checkout.service"
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

/**
 * POST /api/me/bookings — book a fixed-price service (CU-02, CU-07; docs/booking-checkout-feature.md).
 * Online payment answers with a Stripe Checkout `checkoutUrl`; cash goes straight to the provider.
 * Bookings aren't on public pages, so no storefront revalidation.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const input = await parseBody(request, createServiceBookingSchema)
    return created(await createServiceBooking(user.id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not create the booking.")
  }
}
