import { ok, toErrorResponse } from "@/lib/api-route"
import { requireProvider } from "@/services/auth.service"
import { countUnreadMessages } from "@/services/chat.service"

/** GET /api/provider/messages/unread — `{ total }` unread chat messages, for the sidebar badge (docs/messages-feature.md). */
export async function GET() {
  try {
    const user = await requireProvider()
    return ok(await countUnreadMessages(user.id, "PROVIDER"), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not count your messages.")
  }
}
