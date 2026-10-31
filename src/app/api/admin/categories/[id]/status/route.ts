import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { categoryStatusSchema } from "@/schemas/category.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { setCategoryActive } from "@/services/category.service"

/** PATCH /api/admin/categories/[id]/status — `{ isActive }`: show or hide a category on the site. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/categories/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const { isActive } = await parseBody(request, categoryStatusSchema)
    const result = await setCategoryActive(admin.id, id, isActive)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not change the category status.")
  }
}
