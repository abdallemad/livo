import { created, ok, parseBody, parseQuery, toErrorResponse } from "@/lib/api-route"
import { customerRequestListQuerySchema, newRequestSchema } from "@/schemas/customer.schema"
import { requireRole, requireUser } from "@/services/auth.service"
import { listMyRequests } from "@/services/customer.service"
import { createRequest } from "@/services/new-request.service"

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

/**
 * POST /api/me/requests — send a new quote request (CU-03, docs/customer-new-request-feature.md). Customers only;
 * the request opens immediately and matching providers are notified. Requests are private, so nothing public to revalidate.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("CUSTOMER")
    const values = await parseBody(request, newRequestSchema)
    return created(await createRequest(user.id, values))
  } catch (error) {
    return toErrorResponse(error, "Could not send your request.")
  }
}
