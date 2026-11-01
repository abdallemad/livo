import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { ledgerQuerySchema } from "@/schemas/provider-wallet.schema"
import { requireProvider } from "@/services/auth.service"
import { getEarnings } from "@/services/provider-wallet.service"

/** GET /api/provider/earnings?type=&page= — wallet summary + ledger with running balance (PR-11). */
export async function GET(request: Request) {
  try {
    const user = await requireProvider()
    const query = parseQuery(request, ledgerQuerySchema)
    return ok(await getEarnings(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your earnings.")
  }
}
