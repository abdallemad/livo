import "server-only"
import type { BookingStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/**
 * The provider's working hours (`Availability`, PR-10) and reviews received (`Review`, PR-13).
 * Every query is scoped by `providerId` from the session. Dumb queries; rules live in the services.
 */
class ProviderScheduleRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  hasProfile(providerId: string) {
    return db.providerProfile.findUnique({ where: { userId: providerId }, select: { userId: true, ratingAvg: true, ratingCount: true, underReview: true } })
  }

  // --- availability -----------------------------------------------------------

  findAvailability(providerId: string, client: Client = db) {
    return client.availability.findMany({ where: { providerId }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }], select: { weekday: true, startTime: true, endTime: true } })
  }

  /** Replace the whole week in one transaction (delete + insert). */
  async replaceAvailability(providerId: string, rows: { weekday: number; startTime: string; endTime: string }[], client: Client) {
    await client.availability.deleteMany({ where: { providerId } })
    if (rows.length) await client.availability.createMany({ data: rows.map((r) => ({ ...r, providerId })) })
  }

  findBookingsBetween(providerId: string, from: Date, to: Date, statuses: BookingStatus[]) {
    return db.booking.findMany({
      where: { providerId, scheduledAt: { gte: from, lt: to }, status: { in: statuses } },
      orderBy: { scheduledAt: "asc" },
      take: 200,
      select: {
        id: true,
        number: true,
        status: true,
        scheduledAt: true,
        addressSnapshot: true,
        contactUnlockedAt: true,
        service: { select: { title: true } },
        request: { select: { title: true } },
      },
    })
  }

  // --- reviews received ---------------------------------------------------------

  findReviewPage(where: Prisma.ReviewWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.review.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take,
        select: {
          id: true,
          rating: true,
          comment: true,
          providerReply: true,
          isHidden: true,
          createdAt: true,
          updatedAt: true,
          reviewer: { select: { name: true } },
          booking: { select: { id: true, number: true, service: { select: { title: true } }, request: { select: { title: true } } } },
        },
      }),
      db.review.count({ where }),
    ])
  }

  countVisibleByRating(providerId: string) {
    return db.review.groupBy({ by: ["rating"], where: { revieweeId: providerId, isHidden: false }, _count: { _all: true } })
  }

  countReviews(where: Prisma.ReviewWhereInput) {
    return db.review.count({ where })
  }

  /** Conditional: only the reviewee's own, still-visible review. Returns the row count. */
  async setReply(id: string, providerId: string, reply: string | null) {
    const { count } = await db.review.updateMany({ where: { id, revieweeId: providerId, isHidden: false }, data: { providerReply: reply } })
    return count
  }

  findOwnReview(id: string, providerId: string) {
    return db.review.findFirst({ where: { id, revieweeId: providerId }, select: { id: true, isHidden: true } })
  }
}

export const providerScheduleRepository = new ProviderScheduleRepository()
