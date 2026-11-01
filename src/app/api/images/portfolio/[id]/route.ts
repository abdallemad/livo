import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { getPrivateObject, isR2Configured } from "@/lib/r2.provider"
import { idParamSchema } from "@/schemas/common.schema"
import { findPublicPortfolioImage } from "@/services/landing.service"

/**
 * GET /api/images/portfolio/[id] — streams a portfolio photo for public pages (landing page, provider profile;
 * CLAUDE.md §7, docs/landing-page.md). Only files under `uploads/portfolio/` belonging to an APPROVED provider with an
 * ACTIVE account; anything else 404s. Cached for a day (not `immutable`: a provider can be suspended later).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/images/portfolio/[id]">) {
  try {
    const { id } = await parseParams(ctx.params, idParamSchema)
    const file = await findPublicPortfolioImage(id)
    if (!file || !isR2Configured()) throw new NotFoundError("Image not found.")
    const object = await getPrivateObject(file.key)
    if (!object) throw new NotFoundError("Image not found.")
    return new NextResponse(Buffer.from(object.body), {
      headers: {
        "content-type": file.mimeType,
        "cache-control": "public, max-age=3600, s-maxage=86400",
        "x-content-type-options": "nosniff",
      },
    })
  } catch (error) {
    return toErrorResponse(error, "Couldn't load the image.")
  }
}
