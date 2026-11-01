import { NextResponse } from "next/server"
import { parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { getPrivateObject, isR2Configured } from "@/lib/r2.provider"
import { idParamSchema } from "@/schemas/common.schema"
import { findPublicServiceImage } from "@/services/catalog.service"

/**
 * GET /api/images/services/[id] — streams a photo of a LIVE fixed-price service for public pages
 * (CLAUDE.md §7; docs/catalog-feature.md). Only files under `uploads/services/` attached to a service that
 * passes `VISIBLE_SERVICE`: a hidden, switched-off or suspended provider's photos 404. Cached for a day
 * (not `immutable`: a service can be hidden later). Allowed in robots.txt (`/api/images/`).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/images/services/[id]">) {
  try {
    const { id } = await parseParams(ctx.params, idParamSchema)
    const file = await findPublicServiceImage(id)
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
