import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { getProviderDocumentUrl } from "@/services/provider-review.service"

/**
 * GET /api/admin/files/[id] — ADMIN-ONLY preview of a provider verification
 * document (PR-02). 307 to a 5-minute signed inline R2 link; never cached.
 * Only files attached to a ProviderDocument resolve here.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/files/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const url = await getProviderDocumentUrl(id)
    return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Couldn't show the document.")
  }
}
