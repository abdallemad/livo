import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { providerQuoteListQuerySchema } from "@/schemas/provider.schema"
import { requireProvider } from "@/services/auth.service"
import { listQuotesForProvider } from "@/services/provider-quote.service"

/** GET /api/provider/quotes?status=&q=&page= — the signed-in provider's quotes (PR-07). */
export async function GET(request: Request) {
  try {
    const user = await requireProvider()
    const query = parseQuery(request, providerQuoteListQuerySchema)
    return ok(await listQuotesForProvider(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your quotes.")
  }
}
