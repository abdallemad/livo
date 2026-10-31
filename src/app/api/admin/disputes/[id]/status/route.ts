import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { disputeStatusSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { resolveDispute, startDisputeReview } from "@/services/dispute.service"

/**
 * PATCH /api/admin/disputes/[id]/status (AD-05):
 *  - `{ status: "UNDER_REVIEW" }` — take an OPEN dispute into review;
 *  - `{ status: "RESOLVED", resolution, refundAmount?, note }` — settle it (moves money, see
 *    docs/admin-disputes-reviews-feature.md). Not public: no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/disputes/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, disputeStatusSchema)
    if (input.status === "UNDER_REVIEW") return ok(await startDisputeReview(admin.id, id))
    const { status: _status, ...decision } = input
    void _status
    return ok(await resolveDispute(admin.id, id, decision))
  } catch (error) {
    return toErrorResponse(error, "Could not update the dispute.")
  }
}
