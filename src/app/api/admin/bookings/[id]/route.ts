import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { getBookingForAdmin } from "@/services/admin-booking.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/bookings/[id] — money snapshot, payments/escrow, milestones, chat, reviews, history (AD-04). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const booking = await getBookingForAdmin(id)
    if (!booking) throw new NotFoundError("Booking not found.")
    return ok(booking, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the booking.")
  }
}
