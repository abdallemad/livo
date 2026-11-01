import { noContent, ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { idParamSchema } from "@/schemas/common.schema"
import { serviceFormSchema } from "@/schemas/provider-catalog.schema"
import { requireProvider } from "@/services/auth.service"
import { deleteService, getServiceFormData, updateService } from "@/services/provider-catalog.service"

/**
 * GET / PUT / DELETE /api/provider/services/[id] — one of the provider's services (PR-05).
 * Someone else's id is a 404. DELETE is refused (409) once the service has bookings.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/provider/services/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const data = await getServiceFormData(user.id, id)
    if (!data) throw new NotFoundError("That service doesn't exist.")
    return ok(data, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the service.")
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/provider/services/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, serviceFormSchema)
    const result = await updateService(user.id, id, input)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save the service.")
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/provider/services/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deleteService(user.id, id)
    revalidateStorefront()
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Could not delete the service.")
  }
}
