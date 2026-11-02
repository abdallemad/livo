import "server-only"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

const select = { id: true, type: true, title: true, body: true, payload: true, readAt: true, createdAt: true } satisfies Prisma.NotificationSelect

export type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof select }>

/** The signed-in user's notifications (SY-02; docs/notifications-feature.md). Scoped by `userId` from the session. Dumb queries. */
class NotificationRepository {
  findPage(userId: string, where: Prisma.NotificationWhereInput, skip: number, take: number) {
    const w = { ...where, userId }
    return db.$transaction([db.notification.findMany({ where: w, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take, select }), db.notification.count({ where: w })])
  }

  countUnread(userId: string) {
    return db.notification.count({ where: { userId, readAt: null } })
  }

  /** Mark mine read: the given ids, or all of them. Returns the row count. */
  async markRead(userId: string, ids: string[] | null, at: Date) {
    const { count } = await db.notification.updateMany({ where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) }, data: { readAt: at } })
    return count
  }

  findRole(userId: string) {
    return db.user.findUnique({ where: { id: userId }, select: { role: true } })
  }

  findRoles(userIds: string[]) {
    return db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, role: true } })
  }
}

export const notificationRepository = new NotificationRepository()
