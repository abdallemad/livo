import { z } from "zod"
import { noContent, parseParams, toErrorResponse } from "@/lib/api-route"
import { requireProvider } from "@/services/auth.service"
import { markThreadRead } from "@/services/chat.service"

const paramsSchema = z.object({ bookingId: z.string().min(1).max(64) })

/** POST /api/provider/messages/[bookingId]/read — mark this chat read up to now (clears its unread count). 204. */
export async function POST(_request: Request, ctx: RouteContext<"/api/provider/messages/[bookingId]/read">) {
  try {
    const user = await requireProvider()
    const { bookingId } = await parseParams(ctx.params, paramsSchema)
    await markThreadRead(user.id, "PROVIDER", bookingId)
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Could not update the conversation.")
  }
}
