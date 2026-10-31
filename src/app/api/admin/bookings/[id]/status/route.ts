import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { adminCancelStatusSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { cancelBooking } from "@/services/admin-booking.service"
import { requireAdmin } from "@/services/auth.service"

/**
 * PATCH /api/admin/bookings/[id]/status — `{ status: "CANCELLED", reason }` — cancel a booking that hasn't started and has no
 * captured money, with a reason (AD-04). Paid bookings are refused (409): refunds go
 * through a dispute. Not public: no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/bookings/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, adminCancelStatusSchema)
    return ok(await cancelBooking(admin.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not cancel the booking.")
  }
}
