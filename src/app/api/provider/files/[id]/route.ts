import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireProvider } from "@/services/auth.service"
import { getProviderFilePreviewUrl } from "@/services/provider-catalog.service"

/**
 * GET /api/provider/files/[id] — OWNER-ONLY preview of one of the provider's service or portfolio
 * photos: 307 to a 5-minute signed R2 link, never cached. Verification documents are not served here.
 * Public pages will stream published photos through their own image route.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/provider/files/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const url = await getProviderFilePreviewUrl(user.id, id)
    return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Couldn't show the photo.")
  }
}
