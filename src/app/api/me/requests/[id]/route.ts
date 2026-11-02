import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { getMyRequest } from "@/services/customer-request.service"

/** GET /api/me/requests/[id] — one of the customer's quote requests with its quotes (CU-04, docs/customer-request-detail-feature.md). */
export async function GET(_request: Request, ctx: RouteContext<"/api/me/requests/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const request = await getMyRequest(user.id, id)
    if (!request) throw new NotFoundError("That request doesn't exist.")
    return ok(request, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the request.")
  }
}
