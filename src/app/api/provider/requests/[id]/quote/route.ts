import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { providerQuoteSchema } from "@/schemas/provider.schema"
import { requireProvider } from "@/services/auth.service"
import { sendQuote } from "@/services/provider-request.service"

/**
 * PUT /api/provider/requests/[id]/quote — `{ price, durationDays?, message?, validDays }`: send my quote, edit my waiting
 * one, or send it again after withdrawing (one quote per provider per request — PR-07,
 * docs/provider-request-detail-feature.md). Withdrawing stays `PATCH /api/provider/quotes/[id]/status`.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/provider/requests/[id]/quote">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, providerQuoteSchema)
    return ok(await sendQuote(user.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not send the quote.")
  }
}
