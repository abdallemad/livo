import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { notificationListQuerySchema } from "@/schemas/notification.schema"
import { requireUser } from "@/services/auth.service"
import { listMyNotifications } from "@/services/notification.service"

/** GET /api/me/notifications?filter=all|unread&page&perPage — my notifications, newest first, + unread count (docs/notifications-feature.md). */
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const query = parseQuery(request, notificationListQuerySchema)
    return ok(await listMyNotifications(user.id, query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your notifications.")
  }
}
