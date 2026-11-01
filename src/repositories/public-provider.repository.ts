import "server-only"
import { db } from "@/lib/db"
import { PUBLIC_PROVIDER } from "@/repositories/landing.repository"

const name = { select: { nameEn: true, nameAr: true } } as const

/** Key prefix of real portfolio uploads; the public portfolio route serves nothing else. */
const PORTFOLIO_IMAGE_KEY = "uploads/portfolio/"

/**
 * The public provider profile (`/providers/[id]`, PR-04, SY-04; docs/provider-profile-feature.md). Every query is scoped
 * to `PUBLIC_PROVIDER` (approved + active account), and never selects phone, email or address (SY-04). Dumb queries.
 */
class PublicProviderRepository {
  findProvider(userId: string) {
    return db.providerProfile.findFirst({
      where: { userId, ...PUBLIC_PROVIDER },
      select: {
        userId: true,
        bio: true,
        yearsExperience: true,
        ratingAvg: true,
        ratingCount: true,
        completedCount: true,
        createdAt: true,
        updatedAt: true,
        city: name,
        user: { select: { name: true, avatarUrl: true } },
        categories: { where: { category: { isActive: true } }, select: { category: { select: { slug: true, ...name.select, parent: { select: { slug: true, isActive: true } } } } } },
        areas: { where: { area: { isActive: true } }, select: { area: name } },
        availability: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }], select: { weekday: true, startTime: true, endTime: true } },
      },
    })
  }

  /** Portfolio items with at least one servable photo, and only those photos. */
  findPortfolio(userId: string, take: number) {
    return db.portfolioItem.findMany({
      where: { providerId: userId, images: { some: { key: { startsWith: PORTFOLIO_IMAGE_KEY } } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take,
      select: { id: true, title: true, description: true, images: { where: { key: { startsWith: PORTFOLIO_IMAGE_KEY } }, orderBy: { createdAt: "asc" }, select: { id: true } } },
    })
  }

  /** Visible customer reviews only (AD-08 hides a review everywhere). */
  ratingBreakdown(userId: string) {
    return db.review.groupBy({ by: ["rating"], where: { revieweeId: userId, isHidden: false, reviewer: { role: "CUSTOMER" } }, _count: { _all: true } })
  }

  /** Public providers for the sitemap, most recently changed first. */
  findPublicProviderIds(take: number) {
    return db.providerProfile.findMany({ where: PUBLIC_PROVIDER, orderBy: { updatedAt: "desc" }, take, select: { userId: true, updatedAt: true } })
  }
}

export const publicProviderRepository = new PublicProviderRepository()
