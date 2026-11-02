import { z } from "zod"
import { paginationQuerySchema } from "./common.schema"

/** `GET /api/me/notifications` — docs/notifications-feature.md. */
export const notificationListQuerySchema = paginationQuerySchema.extend({
  filter: z.enum(["all", "unread"]).default("all"),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
})
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>

/** `PATCH /api/me/notifications/read` — `{ ids }` marks those read; no `ids` marks every one read. */
export const markNotificationsReadSchema = z.object({ ids: z.array(z.string().min(1).max(64)).max(100).optional() })
export type MarkNotificationsReadValues = z.infer<typeof markNotificationsReadSchema>
