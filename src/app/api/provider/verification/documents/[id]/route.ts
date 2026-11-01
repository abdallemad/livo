import { noContent, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireProvider } from "@/services/auth.service"
import { deleteVerificationDocument } from "@/services/provider-verification.service"

/** DELETE /api/provider/verification/documents/[id] — remove one of the provider's own documents (when allowed). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/provider/verification/documents/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteVerificationDocument(user.id, id)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Couldn't delete the document.")
  }
}
