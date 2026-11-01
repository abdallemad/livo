import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { requireUser } from "@/services/auth.service"
import { setDefaultAddress } from "@/services/customer-account.service"

/** PUT /api/me/addresses/[id]/default — make this the address booking and request forms preselect (CU-14). */
export async function PUT(_request: Request, ctx: RouteContext<"/api/me/addresses/[id]/default">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    return ok(await setDefaultAddress(user.id, id))
  } catch (error) {
    return toErrorResponse(error, "Could not change the default address.")
  }
}
