import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { assistantChatSchema } from "@/schemas/ai-assistant.schema"
import * as assistantService from "@/services/ai-assistant.service"
import { requireAdmin } from "@/services/auth.service"

/**
 * `POST /api/admin/assistant` — one turn of the admin assistant (docs/ai-assistant-feature.md). Grounded in platform
 * KPIs and queues; it advises, the admin decides. 404-gated by the proxy for non-admins; `requireAdmin()` is the check.
 * 429 when rate limited, 503 when Gemini is unavailable.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    const input = await parseBody(request, assistantChatSchema)
    return ok(await assistantService.askAdminAssistant(input, user.id))
  } catch (e) {
    return toErrorResponse(e, "The Livo assistant couldn't answer right now.")
  }
}
