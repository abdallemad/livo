import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { getRequestForAdmin } from "@/services/admin-request.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/requests/[id] — one request with its quotes and bookings (AD-04). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/requests/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const request = await getRequestForAdmin(id)
    if (!request) throw new NotFoundError("Request not found.")
    return ok(request, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the request.")
  }
}
