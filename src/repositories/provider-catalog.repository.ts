import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const fileSelect = { id: true, key: true, mimeType: true, sizeBytes: true } as const
const imagesOrdered = { orderBy: { createdAt: "asc" }, select: fileSelect } as const

const serviceSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  categoryId: true,
  price: true,
  durationMinutes: true,
  isActive: true,
  hiddenByAdminAt: true,
  hiddenByAdminReason: true,
  updatedAt: true,
  category: { select: { nameEn: true, nameAr: true, isActive: true, parent: { select: { isActive: true } } } },
  images: imagesOrdered,
  _count: { select: { bookings: true } },
} satisfies Prisma.ServiceSelect

export type ProviderServiceRow = Prisma.ServiceGetPayload<{ select: typeof serviceSelect }>

const portfolioSelect = {
  id: true,
  title: true,
  description: true,
  sortOrder: true,
  createdAt: true,
  images: imagesOrdered,
} satisfies Prisma.PortfolioItemSelect

export type PortfolioRow = Prisma.PortfolioItemGetPayload<{ select: typeof portfolioSelect }>

/**
 * The provider's own services, portfolio and their photos (PR-04, PR-05). Every query is scoped by
 * `providerId` from the session. Photos are listed in upload order (`createdAt`); the first is the
 * cover. Dumb queries; rules live in the services.
 */
class ProviderCatalogRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findProfile(providerId: string) {
    return db.providerProfile.findUnique({
      where: { userId: providerId },
      select: {
        verificationStatus: true,
        user: { select: { name: true, status: true } },
        categories: {
          select: {
            category: { select: { id: true, nameEn: true, nameAr: true, type: true, isActive: true, parent: { select: { nameEn: true, nameAr: true, isActive: true } } } },
          },
        },
      },
    })
  }

  // --- services ---------------------------------------------------------------

  findServices(providerId: string) {
    return db.service.findMany({ where: { providerId }, orderBy: [{ createdAt: "asc" }], select: serviceSelect })
  }

  findService(id: string, providerId: string, client: Client = db) {
    return client.service.findFirst({ where: { id, providerId }, select: serviceSelect })
  }

  countServices(providerId: string, client: Client = db) {
    return client.service.count({ where: { providerId } })
  }

  slugExists(slug: string, client: Client = db) {
    return client.service.findUnique({ where: { slug }, select: { id: true } }).then(Boolean)
  }

  createService(data: Prisma.ServiceUncheckedCreateInput, client: Client) {
    return client.service.create({ data, select: { id: true } })
  }

  async updateService(id: string, providerId: string, data: Prisma.ServiceUncheckedUpdateManyInput, client: Client) {
    const { count } = await client.service.updateMany({ where: { id, providerId }, data })
    return count
  }

  /** Deletes only when it still has no bookings (re-checked inside the same statement). */
  async deleteServiceWithoutBookings(id: string, providerId: string, client: Client) {
    const { count } = await client.service.deleteMany({ where: { id, providerId, bookings: { none: {} } } })
    return count
  }

  // --- portfolio --------------------------------------------------------------

  findPortfolio(providerId: string, client: Client = db) {
    return client.portfolioItem.findMany({ where: { providerId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: portfolioSelect })
  }

  findPortfolioItem(id: string, providerId: string, client: Client = db) {
    return client.portfolioItem.findFirst({ where: { id, providerId }, select: portfolioSelect })
  }

  async nextSortOrder(providerId: string, client: Client) {
    const agg = await client.portfolioItem.aggregate({ where: { providerId }, _max: { sortOrder: true }, _count: { _all: true } })
    return { next: (agg._max.sortOrder ?? -1) + 1, count: agg._count._all }
  }

  createPortfolioItem(data: Prisma.PortfolioItemUncheckedCreateInput, client: Client) {
    return client.portfolioItem.create({ data, select: { id: true } })
  }

  async updatePortfolioItem(id: string, providerId: string, data: Prisma.PortfolioItemUncheckedUpdateManyInput, client: Client) {
    const { count } = await client.portfolioItem.updateMany({ where: { id, providerId }, data })
    return count
  }

  async deletePortfolioItem(id: string, providerId: string, client: Client) {
    const { count } = await client.portfolioItem.deleteMany({ where: { id, providerId } })
    return count
  }

  // --- files ------------------------------------------------------------------

  createFile(data: { key: string; mimeType: string; sizeBytes: number; sha256: string; uploadedById: string }) {
    return db.file.create({ data, select: fileSelect })
  }

  /** The provider's uploads under `prefix` not attached to anything yet. */
  findPendingFiles(providerId: string, prefix: string, client: Client = db) {
    return client.file.findMany({
      where: { uploadedById: providerId, key: { startsWith: prefix }, serviceId: null, portfolioItemId: null },
      orderBy: { createdAt: "asc" },
      select: fileSelect,
    })
  }

  countFiles(providerId: string, prefix: string) {
    return db.file.count({ where: { uploadedById: providerId, key: { startsWith: prefix } } })
  }

  findOwnFile(id: string, providerId: string) {
    return db.file.findFirst({ where: { id, uploadedById: providerId }, select: { ...fileSelect, serviceId: true, portfolioItemId: true } })
  }

  findFilesByIds(ids: string[], client: Client) {
    return ids.length ? client.file.findMany({ where: { id: { in: ids } }, select: fileSelect }) : Promise.resolve([])
  }

  deleteFiles(ids: string[], client: Client = db) {
    return ids.length ? client.file.deleteMany({ where: { id: { in: ids } } }) : Promise.resolve({ count: 0 })
  }

  /** Attach `ids` to one owner (photos keep their upload order; the first is the cover). */
  attachFiles(owner: { serviceId: string } | { portfolioItemId: string }, providerId: string, ids: string[], client: Client) {
    return ids.length
      ? client.file.updateMany({ where: { id: { in: ids }, uploadedById: providerId }, data: owner })
      : Promise.resolve({ count: 0 })
  }
}

export const providerCatalogRepository = new ProviderCatalogRepository()
