import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const adminListSelect = {
  id: true,
  rating: true,
  comment: true,
  providerReply: true,
  isHidden: true,
  createdAt: true,
  reviewerId: true,
  revieweeId: true,
  reviewer: { select: { name: true } },
  reviewee: { select: { name: true } },
  booking: { select: { id: true, number: true, providerId: true } },
} satisfies Prisma.ReviewSelect

export type AdminReviewRow = Prisma.ReviewGetPayload<{ select: typeof adminListSelect }>

/** Review reads/writes and the provider rating aggregates. Dumb queries; rules live in `admin-review.service.ts`. */
class ReviewRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** Paginated admin list: rows + total in one transaction. */
  findAdminPage(where: Prisma.ReviewWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.review.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: adminListSelect }),
      db.review.count({ where }),
    ])
  }

  countHidden() {
    return db.review.count({ where: { isHidden: true } })
  }

  findForModeration(id: string, client: Client) {
    return client.review.findUnique({
      where: { id },
      select: { id: true, isHidden: true, reviewerId: true, revieweeId: true, booking: { select: { number: true } } },
    })
  }

  /** Conditional hide / unhide in one UPDATE (race-safe). Returns the row count. */
  async setHidden(id: string, hidden: boolean, client: Client) {
    const { count } = await client.review.updateMany({ where: { id, isHidden: !hidden }, data: { isHidden: hidden } })
    return count
  }

  /** Visible reviews of one user — the source of the provider's denormalised rating. */
  aggregateVisible(revieweeId: string, client: Client) {
    return client.review.aggregate({ where: { revieweeId, isHidden: false }, _avg: { rating: true }, _count: true })
  }

  findProviderProfile(userId: string, client: Client) {
    return client.providerProfile.findUnique({ where: { userId }, select: { userId: true } })
  }

  updateProviderRating(userId: string, data: { ratingAvg: number; ratingCount: number; underReview: boolean }, client: Client) {
    return client.providerProfile.update({ where: { userId }, data })
  }

  /** `SiteSetting` value (tunables like the BR-04 threshold). */
  async findSetting(key: string, client: Client = db) {
    return (await client.siteSetting.findUnique({ where: { key }, select: { value: true } }))?.value ?? null
  }
}

export const reviewRepository = new ReviewRepository()
