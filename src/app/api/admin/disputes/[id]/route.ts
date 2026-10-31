import { ok, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { idParamSchema } from "@/schemas/common.schema"
import { requireAdmin } from "@/services/auth.service"
import { getDisputeForAdmin } from "@/services/dispute.service"

/** GET /api/admin/disputes/[id] — the dispute, evidence, chat, money and allowed decisions (AD-05). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/disputes/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const dispute = await getDisputeForAdmin(id)
    if (!dispute) throw new NotFoundError("Dispute not found.")
    return ok(dispute, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the dispute.")
  }
}
