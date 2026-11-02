import { ok, toErrorResponse } from "@/lib/api-route"
import { requireUser } from "@/services/auth.service"
import { listConversations } from "@/services/chat.service"

/** GET /api/me/messages — the customer's conversations: bookings whose chat is (or was) open (docs/messages-feature.md). */
export async function GET() {
  try {
    const user = await requireUser()
    return ok(await listConversations(user.id, "CUSTOMER"), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your messages.")
  }
}
