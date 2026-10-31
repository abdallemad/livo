import { noContent, ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { updateCategorySchema } from "@/schemas/category.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { deleteCategory, getCategoryForAdmin, updateCategory } from "@/services/category.service"

/** GET /api/admin/categories/[id] — the edit form's values. */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const category = await getCategoryForAdmin(id)
    if (!category) throw new NotFoundError("Category not found.")
    return ok(category, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the category.")
  }
}

/** PATCH /api/admin/categories/[id] — edit everything except the slug (it is the public URL). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, updateCategorySchema)
    const category = await updateCategory(admin.id, id, input)
    revalidateStorefront()
    return ok(category)
  } catch (error) {
    return toErrorResponse(error, "Could not save the category.")
  }
}

/** DELETE /api/admin/categories/[id] — only when nothing references it (409 DEPENDENCY otherwise). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteCategory(admin.id, id)
    revalidateStorefront()
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Could not delete the category.")
  }
}
