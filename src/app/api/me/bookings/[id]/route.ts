import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { getMyBooking } from "@/services/customer-booking.service"

/** GET /api/me/bookings/[id] — one of the signed-in customer's bookings (docs/customer-booking-detail-feature.md). */
export async function GET(_request: Request, ctx: RouteContext<"/api/me/bookings/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const booking = await getMyBooking(user.id, id)
    if (!booking) throw new NotFoundError("That booking doesn't exist.")
    return ok(booking, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the booking.")
  }
}
