import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { providerListQuerySchema } from "@/schemas/admin.schema"
import { requireAdmin } from "@/services/auth.service"
import { listProviders } from "@/services/provider-review.service"

/** GET /api/admin/providers?status=PENDING&q=&page= — the provider review queue and every other status tab (AD-01). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, providerListQuerySchema)
    return ok(await listProviders(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load providers.")
  }
}
