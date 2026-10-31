import { noContent, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { deleteServiceImage } from "@/services/onboarding.service"

/** DELETE /api/onboarding/service/images/[id] — remove one of the user's own service images. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/onboarding/service/images/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteServiceImage(user.id, id)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "تعذّر مسح الصورة.")
  }
}
