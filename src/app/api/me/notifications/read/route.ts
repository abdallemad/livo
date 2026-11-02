import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { markNotificationsReadSchema } from "@/schemas/notification.schema"
import { requireUser } from "@/services/auth.service"
import { markMyNotificationsRead } from "@/services/notification.service"

/** PATCH /api/me/notifications/read — `{ ids }` marks those read, `{}` marks all of mine read (docs/notifications-feature.md). */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    const input = await parseBody(request, markNotificationsReadSchema)
    return ok(await markMyNotificationsRead(user.id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not update your notifications.")
  }
}
