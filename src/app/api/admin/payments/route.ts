import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { paymentListQuerySchema } from "@/schemas/admin.schema"
import { listPaymentsForAdmin } from "@/services/admin-payment.service"
import { requireAdmin } from "@/services/auth.service"

/**
 * GET /api/admin/payments?status=&method=&escrow=&q=&page= — every payment with status
 * counts and money totals (AD-07, docs/admin-payments-feature.md). Read-only: there is no
 * write endpoint here; money moves through the webhook, auto-release and disputes.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, paymentListQuerySchema)
    return ok(await listPaymentsForAdmin(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load payments.")
  }
}
