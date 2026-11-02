import { NextResponse } from "next/server"
import { z } from "zod"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { requireProvider } from "@/services/auth.service"
import { getRequestPhotoUrlForProvider } from "@/services/provider-request.service"

const paramsSchema = z.object({ id: z.string().min(1).max(64), fileId: z.string().min(1).max(64) })

/**
 * GET /api/provider/requests/[id]/photos/[fileId] — a customer's request photo for a provider who may open that request
 * (it matches them or they quoted it): 307 to a 5-minute signed R2 link, never cached. Anything else is a 404.
 * docs/provider-request-detail-feature.md.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/provider/requests/[id]/photos/[fileId]">) {
  try {
    const user = await requireProvider()
    const { id, fileId } = await parseParams(ctx.params, paramsSchema)
    const url = await getRequestPhotoUrlForProvider(user.id, id, fileId)
    return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Couldn't show the photo.")
  }
}
