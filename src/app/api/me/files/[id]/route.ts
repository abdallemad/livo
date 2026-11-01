import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { getCustomerFilePreviewUrl } from "@/services/new-request.service"

/**
 * GET /api/me/files/[id] — OWNER-ONLY preview of the customer's own request photo: 307 to a 5-minute signed R2 link,
 * never cached. Anything else (another user's file, another prefix) is a 404.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/me/files/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const url = await getCustomerFilePreviewUrl(user.id, id)
    return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Couldn't show the photo.")
  }
}
