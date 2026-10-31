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
}

export const auditRepository = new AuditRepository()
