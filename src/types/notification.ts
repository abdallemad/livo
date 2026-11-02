import type { NotificationType } from "@prisma/client"
import type { Paginated } from "./api"

/** Notification centre DTOs (SY-02) — docs/notifications-feature.md. */

export interface NotificationDto {
  id: string
  type: NotificationType
  title: string
  body: string | null
  /** The page it opens, for this user's role (`utils/notification.ts`). */
  href: string
  readAt: string | null
  createdAt: string
}

export interface NotificationList extends Paginated<NotificationDto> {
  /** Unread across all of mine (the bell badge), not just this page. */
  unread: number
}
