import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { assistantChatSchema } from "@/schemas/ai-assistant.schema"
import * as assistantService from "@/services/ai-assistant.service"
import { requireRole } from "@/services/auth.service"

/**
 * `POST /api/me/assistant` — one turn of the customer dashboard assistant (docs/ai-assistant-feature.md).
 * Grounded in the signed-in customer's own dashboard; the id comes from the session, never the body.
 * 429 when rate limited, 503 when Gemini is unavailable.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("CUSTOMER", "ADMIN")
    const input = await parseBody(request, assistantChatSchema)
    return ok(await assistantService.askCustomerAssistant(input, user.id))
  } catch (e) {
    return toErrorResponse(e, "The Livo assistant couldn't answer right now.")
  }
}
