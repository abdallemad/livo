import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { disputeStatusSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { startDisputeReview } from "@/services/dispute.service"

/** PATCH /api/admin/disputes/[id]/status — take an OPEN dispute into review (AD-05). Not public: no storefront revalidation. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/disputes/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await parseBody(request, disputeStatusSchema)
    return ok(await startDisputeReview(admin.id, id))
  } catch (error) {
    return toErrorResponse(error, "Could not update the dispute.")
  }
}
