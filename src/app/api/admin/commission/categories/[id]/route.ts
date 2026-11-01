import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { commissionRateBodySchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { clearCategoryRate, setCategoryRate } from "@/services/commission.service"

/**
 * PUT    /api/admin/commission/categories/[id] `{ ratePercent }` — set this category's own rate.
 * DELETE /api/admin/commission/categories/[id] — remove it (falls back to parent / global).
 * `[id]` is the CATEGORY id (AD-06, docs/admin-commission-payouts-feature.md).
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/admin/commission/categories/[id]">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const { ratePercent } = await parseBody(request, commissionRateBodySchema)
    return ok(await setCategoryRate(admin.id, id, ratePercent))
  } catch (error) {
    return toErrorResponse(error, "Could not set the category rate.")
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/commission/categories/[id]">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    return ok(await clearCategoryRate(admin.id, id))
  } catch (error) {
    return toErrorResponse(error, "Could not remove the category rate.")
  }
}
