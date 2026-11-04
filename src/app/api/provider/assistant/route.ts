import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { assistantChatSchema } from "@/schemas/ai-assistant.schema"
import * as assistantService from "@/services/ai-assistant.service"
import { requireProvider } from "@/services/auth.service"

/**
 * `POST /api/provider/assistant` — one turn of the provider dashboard assistant (docs/ai-assistant-feature.md).
 * Grounded in the signed-in provider's own work (requests, bookings, setup, earnings); the id comes from the session.
 * 429 when rate limited, 503 when Gemini is unavailable.
 */
export async function POST(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, assistantChatSchema)
    return ok(await assistantService.askProviderAssistant(input, user.id))
  } catch (e) {
    return toErrorResponse(e, "The Livo assistant couldn't answer right now.")
  }
}
