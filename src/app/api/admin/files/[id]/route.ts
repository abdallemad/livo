import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { getAdminFileUrl } from "@/services/admin-file.service"

/**
 * GET /api/admin/files/[id] — ADMIN-ONLY preview of a private upload: a provider
 * verification document (PR-02), dispute evidence (AD-05) or a chat attachment.
 * 307 to a 5-minute signed inline R2 link; never cached. Other files 404.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/files/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const url = await getAdminFileUrl(id)
    return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Couldn't show the file.")
  }
}
