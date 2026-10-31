import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { providerDecisionSchema } from "@/schemas/admin.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { decideProvider } from "@/services/provider-review.service"

/** PATCH /api/admin/providers/[id]/status — approve or reject a PENDING provider application (AD-01). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/providers/[id]/status">) {
  try {
    const admin = await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, providerDecisionSchema)
    const result = await decideProvider(admin.id, id, input)
    // An approved provider (and their services) becomes publicly visible.
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save the decision.")
  }
}
