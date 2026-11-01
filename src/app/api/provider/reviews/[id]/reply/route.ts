import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { idParamSchema } from "@/schemas/common.schema"
import { reviewReplySchema } from "@/schemas/provider-schedule.schema"
import { requireProvider } from "@/services/auth.service"
import { setReviewReply } from "@/services/provider-received-reviews.service"

/**
 * PUT    /api/provider/reviews/[id]/reply `{ reply }` — add or edit the public reply (PR-13).
 * DELETE /api/provider/reviews/[id]/reply — remove it. Only the reviewed provider; not on hidden reviews.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/provider/reviews/[id]/reply">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const { reply } = await parseBody(request, reviewReplySchema)
    const result = await setReviewReply(user.id, id, reply)
    revalidateStorefront() // replies show under the review on the public profile
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save your reply.")
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/provider/reviews/[id]/reply">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const result = await setReviewReply(user.id, id, null)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not remove your reply.")
  }
}
