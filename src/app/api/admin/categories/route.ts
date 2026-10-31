import { created, ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { createCategorySchema } from "@/schemas/category.schema"
import { requireAdmin } from "@/services/auth.service"
import { createCategory, listCategoriesForAdmin } from "@/services/category.service"

/** GET /api/admin/categories — every category (active or not) in tree order, with usage counts (AD-02). */
export async function GET() {
  try {
    await requireAdmin()
    return ok(await listCategoriesForAdmin(), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load categories.")
  }
}

/** POST /api/admin/categories — create a category. */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const input = await parseBody(request, createCategorySchema)
    const category = await createCategory(admin.id, input)
    revalidateStorefront()
    return created(category)
  } catch (error) {
    return toErrorResponse(error, "Could not create the category.")
  }
}
