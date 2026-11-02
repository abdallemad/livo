import { z } from "zod"
import { created, ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { sendMessageSchema } from "@/schemas/chat.schema"
import { requireUser } from "@/services/auth.service"
import { getThread, sendMessage } from "@/services/chat.service"

const paramsSchema = z.object({ bookingId: z.string().min(1).max(64) })

/** GET /api/me/messages/[bookingId] — one booking's chat as the customer (docs/messages-feature.md). */
export async function GET(_request: Request, ctx: RouteContext<"/api/me/messages/[bookingId]">) {
  try {
    const user = await requireUser()
    const { bookingId } = await parseParams(ctx.params, paramsSchema)
    const thread = await getThread(user.id, "CUSTOMER", bookingId)
    if (!thread) throw new NotFoundError("That conversation doesn't exist.")
    return ok(thread, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load the conversation.")
  }
}

/** POST /api/me/messages/[bookingId] — `{ body, clientId? }`: send a message; pushed live to both sides. */
export async function POST(request: Request, ctx: RouteContext<"/api/me/messages/[bookingId]">) {
  try {
    const user = await requireUser()
    const { bookingId } = await parseParams(ctx.params, paramsSchema)
    const input = await parseBody(request, sendMessageSchema)
    return created(await sendMessage(user.id, "CUSTOMER", bookingId, input))
  } catch (error) {
    return toErrorResponse(error, "Could not send the message.")
  }
}
