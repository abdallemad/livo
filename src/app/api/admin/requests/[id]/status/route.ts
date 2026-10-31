import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { adminCancelStatusSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { cancelRequest } from "@/services/admin-request.service"
import { requireAdmin } from "@/services/auth.service"

/** PATCH /api/admin/requests/[id]/status — `{ status: "CANCELLED", reason }` — close a DRAFT/OPEN request with a reason (AD-04). Not public: no storefront revalidation. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/requests/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, adminCancelStatusSchema)
    return ok(await cancelRequest(admin.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not close the request.")
  }
}
