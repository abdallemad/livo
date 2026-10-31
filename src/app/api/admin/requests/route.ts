import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { requestListQuerySchema } from "@/schemas/admin.schema"
import { listRequestsForAdmin } from "@/services/admin-request.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/requests?status=&categoryId=&q=&page= — every quote request with status counts (AD-04). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, requestListQuerySchema)
    return ok(await listRequestsForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load requests.")
  }
}
