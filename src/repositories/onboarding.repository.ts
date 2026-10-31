import "server-only"
import type { DocumentType, Prisma, PrismaClient, Role } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * Prisma access for the onboarding wizard (docs/onboarding-feature.md). Dumb
 * queries only; every rule lives in `onboarding.service.ts`. Writes accept an
 * optional transaction client so the service can group them atomically.
 */
type Client = PrismaClient | Prisma.TransactionClient

/** Everything the service needs to derive the state and prefill every step, in one round trip. */
const snapshotInclude = {
  addresses: { where: { isDefault: true }, take: 1 },
  interests: { select: { categoryId: true } },
  providerProfile: {
    include: {
      categories: { select: { categoryId: true, category: { select: { type: true, isActive: true } } } },
      areas: { select: { areaId: true } },
      documents: { include: { file: true }, orderBy: { createdAt: "asc" } },
      services: { include: { images: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  },
} satisfies Prisma.UserInclude

export type OnboardingUserRow = Prisma.UserGetPayload<{ include: typeof snapshotInclude }>

class OnboardingRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findUserSnapshot(userId: string, client: Client = db) {
    return client.user.findUnique({ where: { id: userId }, include: snapshotInclude })
  }

  /** Service-image uploads not yet attached to a saved service. */
  findPendingServiceImages(userId: string, keyPrefix: string, client: Client = db) {
    return client.file.findMany({
      where: { uploadedById: userId, serviceId: null, key: { startsWith: keyPrefix } },
      orderBy: { createdAt: "asc" },
    })
  }

  findActiveCities() {
    return db.city.findMany({
      where: { isActive: true },
      orderBy: { nameAr: "asc" },
      include: { areas: { where: { isActive: true }, orderBy: { nameAr: "asc" } } },
    })
  }

  findActiveCategories() {
    return db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
      include: { parent: { select: { nameAr: true, isActive: true } } },
    })
  }

  findActiveArea(areaId: string, cityId: string, client: Client = db) {
    return client.area.findFirst({ where: { id: areaId, cityId, isActive: true, city: { isActive: true } } })
  }

  countActiveAreas(areaIds: string[], cityId: string, client: Client = db) {
    return client.area.count({ where: { id: { in: areaIds }, cityId, isActive: true } })
  }

  countActiveCategories(categoryIds: string[], client: Client = db) {
    return client.category.count({ where: { id: { in: categoryIds }, isActive: true } })
  }

  findActiveCity(cityId: string, client: Client = db) {
    return client.city.findFirst({ where: { id: cityId, isActive: true } })
  }

  updateUser(userId: string, data: Prisma.UserUncheckedUpdateInput, client: Client = db) {
    return client.user.update({ where: { id: userId }, data })
  }

  /** Conditional update: only while onboarding is unfinished, so two tabs can't both "finish". Returns the row count. */
  async completeOnboarding(userId: string, at: Date, client: Client = db) {
    const { count } = await client.user.updateMany({
      where: { id: userId, onboardingCompletedAt: null },
      data: { onboardingCompletedAt: at },
    })
    return count
  }

  upsertCustomerProfile(userId: string, client: Client = db) {
    return client.customerProfile.upsert({ where: { userId }, update: {}, create: { userId } })
  }

  /** Updates the default address in place, or creates it. Call inside a transaction (read-then-write). */
  async replaceDefaultAddress(
    userId: string,
    data: { cityId: string; areaId: string; street: string; details: string | null },
    client: Client
  ) {
    const existing = await client.address.findFirst({ where: { userId, isDefault: true } })
    if (existing) return client.address.update({ where: { id: existing.id }, data })
    return client.address.create({ data: { ...data, userId, label: "البيت", isDefault: true } })
  }

  async replaceInterests(userId: string, categoryIds: string[], client: Client) {
    await client.customerInterest.deleteMany({ where: { userId } })
    if (categoryIds.length) {
      await client.customerInterest.createMany({
        data: categoryIds.map((categoryId) => ({ userId, categoryId })),
        skipDuplicates: true,
      })
    }
  }

  /** Creates the DRAFT profile on first save; later saves only move the city. */
  upsertProviderProfile(userId: string, cityId: string, client: Client = db) {
    return client.providerProfile.upsert({
      where: { userId },
      update: { cityId },
      create: { userId, cityId, verificationStatus: "DRAFT" },
    })
  }

  updateProviderProfile(userId: string, data: Prisma.ProviderProfileUncheckedUpdateInput, client: Client = db) {
    return client.providerProfile.update({ where: { userId }, data })
  }

  async replaceProviderCategories(providerId: string, categoryIds: string[], client: Client) {
    await client.providerCategory.deleteMany({ where: { providerId } })
    await client.providerCategory.createMany({
      data: categoryIds.map((categoryId) => ({ providerId, categoryId })),
      skipDuplicates: true,
    })
  }

  async replaceProviderAreas(providerId: string, areaIds: string[], client: Client) {
    await client.providerArea.deleteMany({ where: { providerId } })
    await client.providerArea.createMany({
      data: areaIds.map((areaId) => ({ providerId, areaId })),
      skipDuplicates: true,
    })
  }

  /** Keeps only areas inside `cityId` (after a city change), then makes sure `areaId` is present. */
  async setPrimaryArea(providerId: string, cityId: string, areaId: string, client: Client) {
    await client.providerArea.deleteMany({ where: { providerId, area: { cityId: { not: cityId } } } })
    await client.providerArea.createMany({ data: [{ providerId, areaId }], skipDuplicates: true })
  }

  findDocuments(providerId: string, type: DocumentType, client: Client = db) {
    return client.providerDocument.findMany({ where: { providerId, type }, include: { file: true } })
  }

  findDocumentById(documentId: string, client: Client = db) {
    return client.providerDocument.findUnique({ where: { id: documentId }, include: { file: true } })
  }

  async createDocument(
    providerId: string,
    type: DocumentType,
    file: { key: string; mimeType: string; sizeBytes: number; sha256: string },
    client: Client
  ) {
    const row = await client.file.create({ data: { ...file, uploadedById: providerId } })
    return client.providerDocument.create({ data: { providerId, type, fileId: row.id }, include: { file: true } })
  }

  /** ProviderDocument restricts deleting its File, so the document row goes first. */
  async deleteDocument(documentId: string, fileId: string, client: Client) {
    await client.providerDocument.delete({ where: { id: documentId } })
    await client.file.delete({ where: { id: fileId } })
  }

  createFile(
    data: { key: string; mimeType: string; sizeBytes: number; sha256: string; uploadedById: string },
    client: Client = db
  ) {
    return client.file.create({ data })
  }

  findFileById(fileId: string, client: Client = db) {
    return client.file.findUnique({ where: { id: fileId } })
  }

  deleteFile(fileId: string, client: Client = db) {
    return client.file.delete({ where: { id: fileId } })
  }

  countUserFiles(userId: string, keyPrefix: string, client: Client = db) {
    return client.file.count({ where: { uploadedById: userId, key: { startsWith: keyPrefix } } })
  }

  slugExists(slug: string, client: Client = db) {
    return client.service.findUnique({ where: { slug }, select: { id: true } }).then(Boolean)
  }

  createService(data: Prisma.ServiceUncheckedCreateInput, client: Client) {
    return client.service.create({ data })
  }

  updateService(serviceId: string, data: Prisma.ServiceUncheckedUpdateInput, client: Client) {
    return client.service.update({ where: { id: serviceId }, data })
  }

  /** Attaches exactly `fileIds` to the service; images dropped from the list go back to pending. */
  async setServiceImages(serviceId: string, userId: string, fileIds: string[], client: Client) {
    await client.file.updateMany({
      where: { serviceId, id: { notIn: fileIds } },
      data: { serviceId: null },
    })
    if (fileIds.length) {
      await client.file.updateMany({ where: { id: { in: fileIds }, uploadedById: userId }, data: { serviceId } })
    }
  }

  findAdminIds(client: Client = db) {
    return client.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } })
  }

  createNotifications(data: Prisma.NotificationCreateManyInput[], client: Client) {
    return client.notification.createMany({ data })
  }

  createAuditLog(data: Prisma.AuditLogUncheckedCreateInput, client: Client) {
    return client.auditLog.create({ data })
  }

  /** Conditional DRAFT → PENDING, so a double submit can't write two audit entries. Returns the row count. */
  async submitProviderForReview(userId: string, client: Client) {
    const { count } = await client.providerProfile.updateMany({
      where: { userId, verificationStatus: "DRAFT" },
      data: { verificationStatus: "PENDING", rejectionReason: null },
    })
    return count
  }

  setRole(userId: string, role: Extract<Role, "CUSTOMER" | "PROVIDER">, at: Date, client: Client = db) {
    return client.user.update({ where: { id: userId }, data: { role, roleSelectedAt: at } })
  }
}

export const onboardingRepository = new OnboardingRepository()
