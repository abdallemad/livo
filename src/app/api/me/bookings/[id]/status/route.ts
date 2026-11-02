import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { customerBookingStatusSchema } from "@/schemas/customer-account.schema"
import { requireUser } from "@/services/auth.service"
import { updateMyBookingStatus } from "@/services/customer-booking.service"

/**
 * PATCH /api/me/bookings/[id]/status — `{ status: "COMPLETED" }` confirms the job is done (CU-09, releases the held
 * payment); `{ status: "CANCELLED", reason? }` cancels before the provider accepts (CU-11, full refund).
 * docs/customer-booking-detail-feature.md. Bookings aren't on public pages: no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/me/bookings/[id]/status">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, customerBookingStatusSchema)
    return ok(await updateMyBookingStatus(user.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not update the booking.")
  }
}
