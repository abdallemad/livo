import { noContent, ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { addressSchema } from "@/schemas/customer-account.schema"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { deleteAddress, updateAddress } from "@/services/customer-account.service"

/** PUT / DELETE /api/me/addresses/[id] — edit or delete one of your addresses (CU-14). Someone else's id is a 404. */
export async function PUT(request: Request, ctx: RouteContext<"/api/me/addresses/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, addressSchema)
    return ok(await updateAddress(user.id, id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not save the address.")
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/me/addresses/[id]">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteAddress(user.id, id)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Could not delete the address.")
  }
}
