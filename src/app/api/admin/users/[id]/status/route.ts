import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { userStatusSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { setUserStatus } from "@/services/admin-user.service"
import { requireAdmin } from "@/services/auth.service"

/** PATCH /api/admin/users/[id]/status — suspend (with a reason) or re-activate an account (AD-03). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, userStatusSchema)
    const result = await setUserStatus(admin.id, id, input)
    // A suspended provider must drop out of public listings.
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not change the account status.")
  }
}
