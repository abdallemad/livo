import { z } from "zod"
import { toErrorResponse } from "@/lib/api-route"
import { ServiceUnavailableError, ValidationError } from "@/lib/errors"
import { signSubscription } from "@/lib/pusher"
import { requireUser } from "@/services/auth.service"
import { assertCanSubscribe } from "@/services/chat.service"

const authSchema = z.object({
  socket_id: z.string().regex(/^\d+\.\d+$/, "Bad socket id."),
  channel_name: z.string().min(1).max(200),
})

/**
 * POST /api/realtime/auth — signs a Pusher **private** channel subscription (docs/realtime-feature.md).
 * pusher-js posts `socket_id` + `channel_name` as a form; the session decides (`assertCanSubscribe`): your own user
 * channel, or a booking channel you're a participant of. Same-origin, so the proxy's CSRF guard applies.
 *
 * The success body is Pusher's own `{ auth }` JSON (pusher-js reads it as is) — the one deliberate exception to the
 * `ApiResponse` envelope. Failures still use the envelope with 401 / 403 / 422 / 503.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const form = Object.fromEntries((await request.formData()).entries())
    const parsed = authSchema.safeParse(form)
    if (!parsed.success) throw new ValidationError("Invalid subscription request.")
    await assertCanSubscribe(user.id, parsed.data.channel_name)
    const auth = signSubscription(parsed.data.socket_id, parsed.data.channel_name)
    if (!auth) throw new ServiceUnavailableError("Real-time updates aren't configured.")
    return Response.json(auth, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not authorize the subscription.")
  }
}
