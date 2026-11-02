import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { startCheckout } from "@/services/booking-checkout.service"

/**
 * POST /api/me/bookings/[id]/checkout — a Stripe Checkout link for the customer's own unpaid booking ("Pay now",
 * retry after a cancelled / expired payment). Reuses an open session. docs/booking-checkout-feature.md.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/me/bookings/[id]/checkout">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    return ok(await startCheckout(user.id, id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not open the payment page.")
  }
}
