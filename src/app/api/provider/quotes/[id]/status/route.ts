import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { providerQuoteStatusSchema } from "@/schemas/provider.schema"
import { requireProvider } from "@/services/auth.service"
import { withdrawQuote } from "@/services/provider-quote.service"

/** PATCH /api/provider/quotes/[id]/status `{ status: "WITHDRAWN" }` — withdraw a waiting quote (PR-07). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/provider/quotes/[id]/status">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await parseBody(request, providerQuoteStatusSchema)
    return ok(await withdrawQuote(user.id, id))
  } catch (error) {
    return toErrorResponse(error, "Could not withdraw the quote.")
  }
}
