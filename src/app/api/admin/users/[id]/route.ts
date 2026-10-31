import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { getUserDetail } from "@/services/admin-user.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/users/[id] — account details, activity counts, recent bookings and history (AD-03). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const user = await getUserDetail(id)
    if (!user) throw new NotFoundError("User not found.")
    return ok(user, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the user.")
  }
}
