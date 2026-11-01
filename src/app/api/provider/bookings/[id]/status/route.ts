import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { providerBookingStatusSchema } from "@/schemas/provider.schema"
import { requireProvider } from "@/services/auth.service"
import { updateBookingStatusByProvider } from "@/services/provider-booking.service"

/**
 * PATCH /api/provider/bookings/[id]/status (PR-08):
 *  - `{ status: "CONFIRMED" }` accept (unlocks contact, BR-02) · `{ status: "REJECTED", reason }` decline
 *  - `{ status: "IN_PROGRESS" }` start · `{ status: "AWAITING_CONFIRMATION" }` mark done (starts the BR-08 window)
 * Rules: `utils/provider-booking.ts`. Not public: no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/provider/bookings/[id]/status">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, providerBookingStatusSchema)
    return ok(await updateBookingStatusByProvider(user.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not update the booking.")
  }
}
