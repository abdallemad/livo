import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { payoutListQuerySchema } from "@/schemas/admin.schema"
import { requireAdmin } from "@/services/auth.service"
import { listPayoutsForAdmin } from "@/services/payout.service"

/** GET /api/admin/payouts?status=&q=&page= — payout requests with counts, totals and wallets (AD-07). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, payoutListQuerySchema)
    return ok(await listPayoutsForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load payout requests.")
  }
}
