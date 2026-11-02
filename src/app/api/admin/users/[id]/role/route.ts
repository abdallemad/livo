import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { userRoleSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { promoteToAdmin } from "@/services/admin-user.service"
import { requireAdmin } from "@/services/auth.service"

/**
 * PATCH /api/admin/users/[id]/role — `{ role: "ADMIN" }`: promote a customer or provider to admin
 * (docs/admin-providers-users-feature.md). Upgrade only. Nothing public changes, so no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]/role">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, userRoleSchema)
    return ok(await promoteToAdmin(admin.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not make that account an admin.")
  }
}
