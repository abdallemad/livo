import { created, ok, parseBody, parseQuery, toErrorResponse } from "@/lib/api-route"
import { payoutRequestSchema, providerPayoutListQuerySchema } from "@/schemas/provider-wallet.schema"
import { requireProvider } from "@/services/auth.service"
import { getPayouts, requestPayout } from "@/services/provider-wallet.service"

/**
 * GET  /api/provider/payouts?page= — wallet summary, whether a request is possible, history (PR-12).
 * POST /api/provider/payouts `{ amount, destinationType, destinationRef }` — request a payout (201).
 * Rules: `utils/provider-wallet.ts`; checked under the provider row lock. Not public: no revalidation.
 */
export async function GET(request: Request) {
  try {
    const user = await requireProvider()
    const query = parseQuery(request, providerPayoutListQuerySchema)
    return ok(await getPayouts(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your payouts.")
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, payoutRequestSchema)
    return created(await requestPayout(user.id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not send your payout request.")
  }
}
