import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { customerPaymentQuerySchema } from "@/schemas/customer-account.schema"
import { requireUser } from "@/services/auth.service"
import { getMyPayments } from "@/services/customer-account.service"

/** GET /api/me/payments?view=payments|invoices&page= — totals, payment history, invoices (CU-13, SY-07). */
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const query = parseQuery(request, customerPaymentQuerySchema)
    return ok(await getMyPayments(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your payments.")
  }
}
