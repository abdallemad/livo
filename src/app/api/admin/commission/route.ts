import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { commissionRateBodySchema } from "@/schemas/admin.schema"
import { requireAdmin } from "@/services/auth.service"
import { getCommissionSettings, updateGlobalRate } from "@/services/commission.service"

/**
 * GET   /api/admin/commission — global rate, every category's effective rate, recent changes (AD-06).
 * PATCH /api/admin/commission `{ ratePercent }` — change the platform-wide rate.
 * Commission isn't shown on public pages, so no storefront revalidation.
 */
export async function GET() {
  try {
    await requireAdmin()
    return ok(await getCommissionSettings(), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load commission settings.")
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin()
    const { ratePercent } = await parseBody(request, commissionRateBodySchema)
    return ok(await updateGlobalRate(admin.id, ratePercent))
  } catch (error) {
    return toErrorResponse(error, "Could not update the commission rate.")
  }
}
