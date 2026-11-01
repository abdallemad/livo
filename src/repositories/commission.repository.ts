import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/** `CommissionSetting` reads/writes (AD-06). Dumb queries; rules live in `commission.service.ts`. */
class CommissionRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** The global row is the one with `categoryId = null` (oldest wins if a duplicate ever slipped in). */
  findGlobal(client: Client = db) {
    return client.commissionSetting.findFirst({ where: { categoryId: null }, orderBy: { createdAt: "asc" } })
  }

  findOverrides(client: Client = db) {
    return client.commissionSetting.findMany({
      where: { categoryId: { not: null } },
      select: { id: true, categoryId: true, ratePercent: true, isActive: true },
    })
  }

  findOverride(categoryId: string, client: Client = db) {
    return client.commissionSetting.findUnique({ where: { categoryId } })
  }

  findCategories() {
    return db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: { id: true, parentId: true, nameEn: true, nameAr: true, isActive: true },
    })
  }

  findCategory(id: string, client: Client = db) {
    return client.category.findUnique({ where: { id }, select: { id: true, nameEn: true, nameAr: true } })
  }

  createGlobal(ratePercent: number, updatedById: string, client: Client) {
    return client.commissionSetting.create({ data: { ratePercent, updatedById } })
  }

  update(id: string, ratePercent: number, updatedById: string, client: Client) {
    return client.commissionSetting.update({ where: { id }, data: { ratePercent, updatedById, isActive: true } })
  }

  upsertOverride(categoryId: string, ratePercent: number, updatedById: string, client: Client) {
    return client.commissionSetting.upsert({
      where: { categoryId },
      update: { ratePercent, updatedById, isActive: true },
      create: { categoryId, ratePercent, updatedById },
    })
  }

  deleteOverride(categoryId: string, client: Client) {
    return client.commissionSetting.deleteMany({ where: { categoryId } })
  }

  /** Latest commission changes from the audit log, newest first. */
  findHistory(take: number) {
    return db.auditLog.findMany({
      where: { action: { startsWith: "commission." } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, action: true, metadata: true, createdAt: true, actor: { select: { name: true } } },
    })
  }
}

export const commissionRepository = new CommissionRepository()
