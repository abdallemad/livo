import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { getProviderDetail } from "@/services/provider-review.service"

/** GET /api/admin/providers/[id] — everything the review page shows (AD-01). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/providers/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const provider = await getProviderDetail(id)
    if (!provider) throw new NotFoundError("Provider not found.")
    return ok(provider, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the provider.")
  }
}
