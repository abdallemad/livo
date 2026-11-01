import { noContent, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireRole } from "@/services/auth.service"
import { deleteRequestPhoto } from "@/services/new-request.service"

/** DELETE /api/me/requests/images/[id] — delete a photo not yet sent with a request. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/me/requests/images/[id]">) {
  try {
    const user = await requireRole("CUSTOMER")
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteRequestPhoto(user.id, id)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Couldn't delete the photo.")
  }
}
