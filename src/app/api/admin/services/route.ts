import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { serviceListQuerySchema } from "@/schemas/admin.schema"
import { listServicesForAdmin } from "@/services/admin-catalog.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/services?q=&categoryId=&visibility=&page= — every fixed-price service and why it is (not) public (AD-02). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, serviceListQuerySchema)
    return ok(await listServicesForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load services.")
  }
}
