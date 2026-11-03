import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { ForbiddenError } from "@/lib/errors"
import { assistantChatSchema } from "@/schemas/ai-assistant.schema"
import * as assistantService from "@/services/ai-assistant.service"
import { getCurrentUser } from "@/services/auth.service"

/**
 * `POST /api/assistant/chat` — one Livo AI Assistant turn (docs/ai-assistant-feature.md).
 * Open to guests (the assistant lives on public pages), so the guard is a per-visitor rate limit keyed by the
 * session's user id, else the client IP; a suspended account is refused. The role comes from the session, never
 * from the body. Same-origin only (proxy CSRF check). Answers `AssistantReply`; 429 / 503 when limited or unavailable.
 */
function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip") || "unknown"
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (user && user.status !== "ACTIVE") throw new ForbiddenError("Your account is suspended. Contact support for help.")
    const input = await parseBody(request, assistantChatSchema)
    const reply = await assistantService.askAssistant(input, {
      key: user ? `user:${user.id}` : `ip:${clientIp(request)}`,
      viewer: user?.role ?? "GUEST",
    })
    return ok(reply)
  } catch (e) {
    return toErrorResponse(e, "The Livo assistant couldn't answer right now.")
  }
}
