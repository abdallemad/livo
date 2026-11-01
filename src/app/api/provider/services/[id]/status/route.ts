import { ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { idParamSchema } from "@/schemas/common.schema"
import { serviceStatusSchema } from "@/schemas/provider-catalog.schema"
import { requireProvider } from "@/services/auth.service"
import { setServiceActive } from "@/services/provider-catalog.service"

/** PATCH /api/provider/services/[id]/status `{ isActive }` — the provider's own on/off switch (PR-05). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/provider/services/[id]/status">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const { isActive } = await parseBody(request, serviceStatusSchema)
    const result = await setServiceActive(user.id, id, isActive)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not switch the service.")
  }
}
