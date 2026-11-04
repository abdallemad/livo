import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { idParamSchema } from "@/schemas/common.schema"
import { customerReviewSchema } from "@/schemas/customer-review.schema"
import { requireUser } from "@/services/auth.service"
import { getMyBookingReview, saveMyBookingReview } from "@/services/customer-review.service"

/**
 * The signed-in customer's review of one of their bookings (CU-10, BR-03, SY-05; docs/customer-review-feature.md).
 *
 * GET — the booking, the provider, the review if there is one, and why it can't be rated / edited (`private, no-store`).
 * PUT — `{ rating: 1..5, comment? }` creates the review (finished bookings only) or edits it inside the edit window.
 *       409 when the booking can't be rated or the review can't be changed; 422 for a bad rating or a comment with
 *       contact details. Reviews and ratings are public, so a save revalidates the storefront.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/me/bookings/[id]/review">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const data = await getMyBookingReview(user.id, id)
    if (!data) throw new NotFoundError("That booking doesn't exist.")
    return ok(data, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the review.")
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/me/bookings/[id]/review">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, customerReviewSchema)
    const saved = await saveMyBookingReview(user.id, id, input)
    revalidateStorefront()
    return ok(saved)
  } catch (error) {
    return toErrorResponse(error, "Could not save your review.")
  }
}
