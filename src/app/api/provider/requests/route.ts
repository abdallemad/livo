import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { providerRequestListQuerySchema } from "@/schemas/provider.schema"
import { requireProvider } from "@/services/auth.service"
import { listRequestsForProvider } from "@/services/provider-request.service"

/**
 * GET /api/provider/requests?tab=&scope=&sort=&categoryId=&q=&page= — open requests matching the
 * signed-in provider (PR-06, SY-01), or the ones they quoted. The provider id comes from the
 * session only. No customer identity or address in the response (BR-02).
 */
export async function GET(request: Request) {
  try {
    const user = await requireProvider()
    const query = parseQuery(request, providerRequestListQuerySchema)
    return ok(await listRequestsForProvider(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load requests.")
  }
}
