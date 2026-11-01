import "server-only"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

const name = { select: { nameEn: true, nameAr: true } } as const

/** Key prefix of real service uploads (`file-upload.service.ts`); the public image route serves nothing else. */
export const SERVICE_IMAGE_KEY = "uploads/services/"

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  durationMinutes: true,
  providerId: true,
  category: { select: { slug: true, nameEn: true, nameAr: true, iconKey: true, parent: { select: { iconKey: true } } } },
  provider: { select: { ratingAvg: true, ratingCount: true, user: { select: { name: true } } } },
  // Only photos the public image route will serve (same prefix rule), so a card never links a 404.
  images: { where: { key: { startsWith: SERVICE_IMAGE_KEY } }, orderBy: { createdAt: "asc" }, take: 1, select: { id: true } },
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

  /** A live service by slug, with everything its public page shows. */
  findServiceBySlug(slug: string, visible: Prisma.ServiceWhereInput) {
    return db.service.findFirst({
      where: { AND: [visible, { slug }] },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        price: true,
        durationMinutes: true,
        updatedAt: true,
        categoryId: true,
        images: { where: { key: { startsWith: SERVICE_IMAGE_KEY } }, orderBy: { createdAt: "asc" }, select: { id: true } },
        category: { select: { slug: true, nameEn: true, nameAr: true, type: true, parent: { select: { slug: true, nameEn: true, nameAr: true } } } },
        provider: {
          select: {
            userId: true,
            bio: true,
            yearsExperience: true,
            ratingAvg: true,
            ratingCount: true,
            completedCount: true,
            createdAt: true,
            city: name,
            areas: { select: { area: name } },
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    })
  }

  /** Visible reviews customers left for a provider, newest first (hidden ones never leave the admin area — AD-08). */
  findProviderReviews(providerId: string, take: number) {
    return db.review.findMany({
      where: { revieweeId: providerId, isHidden: false, reviewer: { role: "CUSTOMER" } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, rating: true, comment: true, providerReply: true, createdAt: true, reviewer: { select: { name: true } } },
    })
  }

  findServices(where: Prisma.ServiceWhereInput, orderBy: Prisma.ServiceOrderByWithRelationInput[], take: number) {
    return db.service.findMany({ where, orderBy, take, select: cardSelect })
  }

  /** A photo of a LIVE service only — hidden / off / suspended services' photos are not served publicly. */
  findPublicServiceImage(fileId: string, visible: Prisma.ServiceWhereInput) {
    return db.file.findFirst({ where: { id: fileId, key: { startsWith: SERVICE_IMAGE_KEY }, service: visible }, select: { key: true, mimeType: true } })
  }
}

export const catalogRepository = new CatalogRepository()
