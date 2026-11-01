import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { requireProvider } from "@/services/auth.service"
import { getBookingForProvider } from "@/services/provider-booking.service"

/** GET /api/provider/bookings/[id] — one of the provider's bookings; anyone else's is a 404 (PR-08, BR-02). */
export async function GET(_request: Request, ctx: RouteContext<"/api/provider/bookings/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const booking = await getBookingForProvider(user.id, id)
    if (!booking) throw new NotFoundError("That booking doesn't exist.")
    return ok(booking, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the booking.")
  }
}
