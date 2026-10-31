import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { disputeListQuerySchema } from "@/schemas/admin.schema"
import { requireAdmin } from "@/services/auth.service"
import { listDisputesForAdmin } from "@/services/dispute.service"

/** GET /api/admin/disputes?status=&q=&page= — the dispute queue with status counts (AD-05). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, disputeListQuerySchema)
    return ok(await listDisputesForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load disputes.")
  }
}
