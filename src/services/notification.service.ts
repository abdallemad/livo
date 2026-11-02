import "server-only"
import type { NotificationType, Prisma } from "@prisma/client"
import { pushNotification } from "@/lib/pusher"
import { notificationRepository as repo } from "@/repositories/notification.repository"
import type { MarkNotificationsReadValues, NotificationListQuery } from "@/schemas/notification.schema"
import type { NotificationList } from "@/types/notification"
import { notificationHref } from "@/utils/notification"

/**
 * The notification centre (SY-02; docs/notifications-feature.md): the signed-in user's `Notification` rows — the bell in
 * every dashboard header and `/account/notifications` — and pushing freshly saved rows live through Pusher
 * (docs/realtime-feature.md). The user id always comes from the session.
 */

export async function listMyNotifications(userId: string, query: NotificationListQuery): Promise<NotificationList> {
  const [role, [rows, total], unread] = await Promise.all([
    repo.findRole(userId),
    repo.findPage(userId, query.filter === "unread" ? { readAt: null } : {}, (query.page - 1) * query.perPage, query.perPage),
    repo.countUnread(userId),
  ])
  return {
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: notificationHref(n.type, n.payload, role?.role ?? "CUSTOMER"),
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    unread,
  }
}

export async function markMyNotificationsRead(userId: string, values: MarkNotificationsReadValues): Promise<{ updated: number }> {
  return { updated: await repo.markRead(userId, values.ids ?? null, new Date()) }
}

/** The shape services already write (`createNotification` / `createMany`). */
export interface StoredNotification {
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  payload?: Prisma.InputJsonValue | null
}

/**
 * Push rows that were **just committed** to their users' private channels, so the bell count and a toast appear at once.
 * Best effort (`publish` never throws). Call it after the transaction, with the same data it wrote.
 */
export async function pushStoredNotifications(rows: StoredNotification[]): Promise<void> {
  if (rows.length === 0) return
  const roles = new Map((await repo.findRoles([...new Set(rows.map((r) => r.userId))])).map((u) => [u.id, u.role]))
  await Promise.all(
    rows.map((r) =>
      pushNotification(r.userId, { type: r.type, title: r.title, body: r.body ?? null, href: notificationHref(r.type, r.payload ?? null, roles.get(r.userId) ?? "CUSTOMER") }),
    ),
  )
}
