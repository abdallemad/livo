import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { providerReviewListQuerySchema } from "@/schemas/provider-schedule.schema"
import { requireProvider } from "@/services/auth.service"
import { listReceivedReviews } from "@/services/provider-received-reviews.service"

/** GET /api/provider/reviews?filter=&rating=&page= — reviews customers left for the signed-in provider (PR-13). */
export async function GET(request: Request) {
  try {
    const user = await requireProvider()
    const query = parseQuery(request, providerReviewListQuerySchema)
    return ok(await listReceivedReviews(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your reviews.")
  }
}
