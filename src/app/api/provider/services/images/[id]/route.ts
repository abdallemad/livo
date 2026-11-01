import { noContent, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireProvider } from "@/services/auth.service"
import { deletePendingImage } from "@/services/provider-catalog.service"

/** DELETE /api/provider/services/images/[id] — delete a photo not yet saved on a service. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/provider/services/images/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deletePendingImage(user.id, "service", id)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Couldn't delete the photo.")
  }
}
