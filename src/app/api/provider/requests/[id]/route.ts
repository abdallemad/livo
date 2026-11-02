import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { requireProvider } from "@/services/auth.service"
import { getRequestForProvider } from "@/services/provider-request.service"

/**
 * GET /api/provider/requests/[id] — one request as the provider may see it (no customer identity or street address)
 * with my quote on it (PR-07, docs/provider-request-detail-feature.md). 404 unless it matches me or I quoted it.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/provider/requests/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const detail = await getRequestForProvider(user.id, id)
    if (!detail) throw new NotFoundError("That request doesn't exist.")
    return ok(detail, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the request.")
  }
}
