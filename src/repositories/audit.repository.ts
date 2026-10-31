import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/**
 * Append-only writes for the audit trail (AD-11) and in-app notifications.
 * Take the caller's transaction client so the log entry commits with the
 * change it describes, or not at all.
 */
class AuditRepository {
  createAuditLog(data: Prisma.AuditLogUncheckedCreateInput, client: Client = db) {
    return client.auditLog.create({ data })
  }

  createNotification(data: Prisma.NotificationUncheckedCreateInput, client: Client = db) {
    return client.notification.create({ data })
  }

  /** Newest first: the history panel on an admin detail page. */
  findForEntity(entityType: string, entityId: string, take: number) {
    return db.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, action: true, metadata: true, createdAt: true, actor: { select: { name: true } } },
    })
  }

  findLatest(entityType: string, entityId: string, action: string) {
    return db.auditLog.findFirst({
      where: { entityType, entityId, action },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    })
  }
}

export const auditRepository = new AuditRepository()
