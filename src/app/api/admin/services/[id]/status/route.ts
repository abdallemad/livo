import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { serviceModerationSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { moderateService } from "@/services/admin-catalog.service"
import { requireAdmin } from "@/services/auth.service"

/** PATCH /api/admin/services/[id]/status — `{ action: "HIDE", reason }` or `{ action: "RESTORE" }` (AD-02 moderation). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/services/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, serviceModerationSchema)
    const result = await moderateService(admin.id, id, input)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not update the service.")
  }
}
