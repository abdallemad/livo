import { ok, toErrorResponse } from "@/lib/api-route"
import { requireProvider } from "@/services/auth.service"
import { listConversations } from "@/services/chat.service"

/** GET /api/provider/messages — the provider's conversations: bookings whose chat is (or was) open (docs/messages-feature.md). */
export async function GET() {
  try {
    const user = await requireProvider()
    return ok(await listConversations(user.id, "PROVIDER"), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your messages.")
  }
}
