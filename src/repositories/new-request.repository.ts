import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const name = { select: { nameEn: true, nameAr: true } } as const

/**
 * Creating a quote request (CU-03): form options, the request itself, its photos and the providers to notify
 * (Flow 2). Scoped by the customer id from the session. Dumb queries; rules live in `new-request.service.ts`.
 */
class NewRequestRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findCustomer(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        cityId: true,
        city: name,
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], select: { id: true, label: true, street: true, details: true, areaId: true, cityId: true, isDefault: true, area: name } },
      },
    })
  }

  /** Active categories (parent active too) with their type — the service keeps the quote ones. */
  findActiveCategories() {
    return db.category.findMany({
      where: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: { id: true, slug: true, type: true, parentId: true, ...name.select, parent: name },
    })
  }

  findActiveAreas(cityId: string) {
    return db.area.findMany({ where: { cityId, isActive: true }, orderBy: { nameEn: "asc" }, select: { id: true, ...name.select } })
  }

  findCategory(id: string) {
    return db.category.findFirst({ where: { id, isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] }, select: { id: true, type: true, parentId: true, ...name.select } })
  }

  findArea(id: string, cityId: string) {
    return db.area.findFirst({ where: { id, cityId, isActive: true }, select: { id: true, ...name.select } })
  }

  findSetting(key: string) {
    return db.siteSetting.findUnique({ where: { key }, select: { value: true } }).then((r) => r?.value ?? null)
  }

  createRequest(data: Prisma.ServiceRequestUncheckedCreateInput, client: Client) {
    return client.serviceRequest.create({ data, select: { id: true } })
  }

  attachImages(requestId: string, userId: string, ids: string[], client: Client) {
    return ids.length ? client.file.updateMany({ where: { id: { in: ids }, uploadedById: userId }, data: { requestId } }) : Promise.resolve({ count: 0 })
  }

  /**
   * Providers the request matches (SY-01, the reverse of `utils/request-matching.ts`): approved with an active account, same
   * city, offering the category or its parent, and covering the area (or listing no areas = whole city).
   */
  findMatchingProviderIds(input: { cityId: string; categoryIds: string[]; areaId: string | null }, take: number) {
    return db.providerProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        user: { status: "ACTIVE" },
        cityId: input.cityId,
        categories: { some: { categoryId: { in: input.categoryIds } } },
        ...(input.areaId ? { OR: [{ areas: { none: {} } }, { areas: { some: { areaId: input.areaId } } }] } : {}),
      },
      take,
      select: { userId: true },
    })
  }

  createNotifications(data: Prisma.NotificationCreateManyInput[], client: Client) {
    return data.length ? client.notification.createMany({ data }) : Promise.resolve({ count: 0 })
  }

  // --- photos -------------------------------------------------------------------

  createFile(data: { key: string; mimeType: string; sizeBytes: number; sha256: string; uploadedById: string }) {
    return db.file.create({ data, select: { id: true, mimeType: true, sizeBytes: true } })
  }

  findPendingFiles(userId: string, prefix: string, client: Client = db) {
    return client.file.findMany({ where: { uploadedById: userId, key: { startsWith: prefix }, requestId: null }, orderBy: { createdAt: "asc" }, select: { id: true, mimeType: true, sizeBytes: true } })
  }

  countFiles(userId: string, prefix: string) {
    return db.file.count({ where: { uploadedById: userId, key: { startsWith: prefix } } })
  }

  findOwnFile(id: string, userId: string) {
    return db.file.findFirst({ where: { id, uploadedById: userId }, select: { id: true, key: true, mimeType: true, requestId: true } })
  }

  deleteFile(id: string) {
    return db.file.delete({ where: { id } })
  }
}

export const newRequestRepository = new NewRequestRepository()
