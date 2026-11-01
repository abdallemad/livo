import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { idParamSchema } from "@/schemas/common.schema"
import { customerRequestStatusSchema } from "@/schemas/customer.schema"
import { requireUser } from "@/services/auth.service"
import { cancelMyRequest } from "@/services/customer.service"

/**
 * PATCH /api/me/requests/[id]/status `{ status: "CANCELLED" }` — cancel your own draft / open request (CU-11).
 * Someone else's request is a 404. Requests aren't public pages: no storefront revalidation.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/me/requests/[id]/status">) {
  try {
    const user = await requireUser()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await parseBody(request, customerRequestStatusSchema)
    return ok(await cancelMyRequest(user.id, id))
  } catch (error) {
    return toErrorResponse(error, "Could not cancel the request.")
  }
}
