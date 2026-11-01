import "server-only"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

const name = { select: { nameEn: true, nameAr: true } } as const

/** Key prefix of real portfolio uploads; the public portfolio route serves nothing else. */
const PORTFOLIO_IMAGE_KEY = "uploads/portfolio/"

/** A provider the public may see: verified by an admin AND an active account (same rule as `VISIBLE_SERVICE`). */
export const PUBLIC_PROVIDER = { verificationStatus: "APPROVED", user: { status: "ACTIVE" } } satisfies Prisma.ProviderProfileWhereInput

/**
 * Landing-page reads (docs/landing-page.md). Visibility is part of every query here: only public providers, only
 * visible customer reviews. Never selects phone or email (SY-04). Dumb queries; the rules live in `landing.service.ts`.
 */
class LandingRepository {
  findFeaturedProviders(take: number) {
    return db.providerProfile.findMany({
      where: PUBLIC_PROVIDER,
      orderBy: [{ ratingCount: "desc" }, { completedCount: "desc" }, { createdAt: "asc" }],
      take,
      select: {
        userId: true,
        yearsExperience: true,
        ratingAvg: true,
        ratingCount: true,
        completedCount: true,
        user: { select: { name: true, avatarUrl: true } },
        categories: { take: 1, select: { category: { select: { ...name.select, iconKey: true } } } },
        portfolio: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          where: { images: { some: { key: { startsWith: PORTFOLIO_IMAGE_KEY } } } },
          take: 1,
          // Only photos the public portfolio route will serve (same prefix rule), so a card never links a 404.
          select: { title: true, images: { where: { key: { startsWith: PORTFOLIO_IMAGE_KEY } }, orderBy: { createdAt: "asc" }, take: 1, select: { id: true } } },
        },
      },
    })
  }

  /** Portfolio photos of public providers, newest first, with what's needed to label them. */
  findGalleryImages(take: number) {
    return db.file.findMany({
      where: { key: { startsWith: PORTFOLIO_IMAGE_KEY }, portfolioItem: { provider: PUBLIC_PROVIDER } },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        portfolioItem: {
          select: {
            title: true,
            provider: {
              select: {
                user: { select: { name: true } },
                categories: { take: 1, select: { category: name } },
                areas: { take: 1, select: { area: name } },
              },
            },
          },
        },
      },
    })
  }

  async platformStats() {
    const visibleCustomerReviews = { isHidden: false, reviewer: { role: "CUSTOMER" }, reviewee: { providerProfile: { isNot: null } } } satisfies Prisma.ReviewWhereInput
    const [reviews, approvedProviders, completedJobs] = await Promise.all([
      db.review.aggregate({ where: visibleCustomerReviews, _count: { _all: true }, _avg: { rating: true } }),
      db.providerProfile.count({ where: PUBLIC_PROVIDER }),
      db.booking.count({ where: { status: { in: ["COMPLETED", "CLOSED"] } } }),
    ])
    return { reviewsCount: reviews._count._all, averageRating: reviews._avg.rating, approvedProviders, completedJobs }
  }

  /** A portfolio photo of a public provider only — the public image route's check. */
  findPublicPortfolioImage(fileId: string) {
    return db.file.findFirst({ where: { id: fileId, key: { startsWith: PORTFOLIO_IMAGE_KEY }, portfolioItem: { provider: PUBLIC_PROVIDER } }, select: { key: true, mimeType: true } })
  }
}

export const landingRepository = new LandingRepository()
