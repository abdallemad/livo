import { noContent, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { deleteDocument } from "@/services/onboarding.service"

/** DELETE /api/onboarding/documents/[id] — remove one of the user's OWN documents before submitting. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/onboarding/documents/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteDocument(user.id, id)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "تعذّر مسح المستند.")
  }
}
