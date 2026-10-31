import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { reviewModerationSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { moderateReview } from "@/services/admin-review.service"
import { requireAdmin } from "@/services/auth.service"

/** PATCH /api/admin/reviews/[id]/status — `{ action: "HIDE", reason }` / `{ action: "SHOW" }` (AD-08). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/reviews/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, reviewModerationSchema)
    const result = await moderateReview(admin.id, id, input)
    // Reviews and the provider's rating are shown on public provider and service pages.
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not update the review.")
  }
}
