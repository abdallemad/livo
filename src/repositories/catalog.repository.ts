import "server-only"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

const name = { select: { nameEn: true, nameAr: true } } as const

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  durationMinutes: true,
  providerId: true,
  category: { select: { slug: true, nameEn: true, nameAr: true } },
  provider: { select: { ratingAvg: true, ratingCount: true, user: { select: { name: true } } } },
  images: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true } },
} satisfies Prisma.ServiceSelect

export type CatalogServiceRow = Prisma.ServiceGetPayload<{ select: typeof cardSelect }>

/**
 * Public catalog reads (MK-02). Callers pass `VISIBLE_SERVICE` inside every service `where` — visibility is
 * enforced in the service layer (CLAUDE.md §6). No user data beyond a provider's public name and rating.
 */
class CatalogRepository {
  /** Active categories whose parent (if any) is active too, in display order. */
  findActiveCategories() {
    return db.category.findMany({
      where: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: { id: true, slug: true, nameEn: true, nameAr: true, description: true, iconKey: true, type: true, parentId: true },
    })
  }

  countServicesByCategory(visible: Prisma.ServiceWhereInput) {
    return db.service.groupBy({ by: ["categoryId"], where: visible, _count: { _all: true } })
  }

  findServicePage(where: Prisma.ServiceWhereInput, orderBy: Prisma.ServiceOrderByWithRelationInput[], skip: number, take: number) {
    return db.$transaction([db.service.findMany({ where, orderBy, skip, take, select: cardSelect }), db.service.count({ where })])
  }

  async priceBounds(visible: Prisma.ServiceWhereInput) {
    const agg = await db.service.aggregate({ where: visible, _min: { price: true }, _max: { price: true } })
    return agg._min.price && agg._max.price ? { min: Number(agg._min.price.toString()), max: Number(agg._max.price.toString()) } : null
  }

  findActiveAreas() {
    return db.area.findMany({ where: { isActive: true, city: { isActive: true } }, orderBy: { nameEn: "asc" }, select: { id: true, slug: true, ...name.select } })
  }

  countProviders(categoryIds: string[]) {
    return db.providerProfile.count({
      where: { verificationStatus: "APPROVED", user: { status: "ACTIVE" }, categories: { some: { categoryId: { in: categoryIds } } } },
    })
  }

  /** A photo of a LIVE service only — hidden / off / suspended services' photos are not served publicly. */
  findPublicServiceImage(fileId: string, visible: Prisma.ServiceWhereInput) {
    return db.file.findFirst({ where: { id: fileId, key: { startsWith: "uploads/services/" }, service: visible }, select: { key: true, mimeType: true } })
  }
}

export const catalogRepository = new CatalogRepository()
