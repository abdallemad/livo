import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { reviewListQuerySchema } from "@/schemas/admin.schema"
import { listReviewsForAdmin } from "@/services/admin-review.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/reviews?visibility=&rating=&direction=&q=&page= — every review, both directions (AD-08). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, reviewListQuerySchema)
    return ok(await listReviewsForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load reviews.")
  }
}
