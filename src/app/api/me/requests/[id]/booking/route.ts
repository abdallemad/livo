import { created, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { acceptQuoteSchema } from "@/schemas/customer.schema"
import { requireUser } from "@/services/auth.service"
import { acceptQuote } from "@/services/customer-request.service"

/**
 * POST /api/me/requests/[id]/booking — `{ quoteId, paymentMethod }`: accept one quote, which creates the request's
 * booking (CU-05; docs/customer-request-detail-feature.md). Online payment answers with a Stripe `checkoutUrl`.
 * Requests and bookings aren't public pages: no storefront revalidation.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/me/requests/[id]/booking">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, acceptQuoteSchema)
    return created(await acceptQuote(user.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not accept the quote.")
  }
}
