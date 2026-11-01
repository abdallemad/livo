import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { customerRequestListQuerySchema } from "@/schemas/customer.schema"
import { requireUser } from "@/services/auth.service"
import { listMyRequests } from "@/services/customer.service"

/** GET /api/me/requests?tab=&q=&page= — the signed-in customer's quote requests with their status (CU-13). */
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const query = parseQuery(request, customerRequestListQuerySchema)
    return ok(await listMyRequests(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your requests.")
  }
}
