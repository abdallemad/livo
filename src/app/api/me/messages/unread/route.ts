import { ok, toErrorResponse } from "@/lib/api-route"
import { requireUser } from "@/services/auth.service"
import { countUnreadMessages } from "@/services/chat.service"

/** GET /api/me/messages/unread — `{ total }` unread chat messages, for the sidebar badge (docs/messages-feature.md). */
export async function GET() {
  try {
    const user = await requireUser()
    return ok(await countUnreadMessages(user.id, "CUSTOMER"), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not count your messages.")
  }
}
