import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { payoutStatusSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { decidePayout } from "@/services/payout.service"

/**
 * PATCH /api/admin/payouts/[id]/status (AD-07):
 *  - `{ status: "APPROVED" }` — REQUESTED → APPROVED (balance must cover it);
 *  - `{ status: "REJECTED", reason }` — REQUESTED / APPROVED → REJECTED;
 *  - `{ status: "PAID", reference? }` — APPROVED → PAID, writes the PAYOUT ledger row.
 * Rules: `utils/payout-rules.ts`. Not public: no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/payouts/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, payoutStatusSchema)
    return ok(await decidePayout(admin.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not update the payout.")
  }
}
