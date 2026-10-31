import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { getFilePreviewUrl } from "@/services/onboarding.service"

/**
 * GET /api/onboarding/files/[id] — OWNER-ONLY preview of an onboarding upload.
 * 307 to a 5-minute signed R2 link; the response itself is never cached.
 * This is not a public image route: verification documents are only ever
 * reachable here (owner) and from the admin review (admins).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/onboarding/files/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const url = await getFilePreviewUrl(user.id, id)
    return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "تعذّر عرض الملف.")
  }
}
