import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { getBookingConfirmation } from "@/services/booking-checkout.service"

/**
 * GET /api/me/bookings/[id]/confirmation — the wizard's last step (owner only). Polled after the Stripe redirect
 * until the payment settles; may ask Stripe directly if the webhook hasn't arrived yet. docs/booking-checkout-feature.md.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/me/bookings/[id]/confirmation">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    return ok(await getBookingConfirmation(user.id, id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the booking.")
  }
}
