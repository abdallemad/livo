import "server-only"
import type { BookingStatus, Prisma, WalletTxType } from "@prisma/client"
import { db } from "@/lib/db"

const place = { select: { id: true, nameEn: true, nameAr: true } } as const

/**
 * Reads for the provider's own workspace (`/provider`, `/provider/requests`):
 * profile + matching inputs, counters, ledger sums and today's bookings. Every method takes
 * the provider id from the caller, which takes it from the session. Dumb queries.
 */
class ProviderDashboardRepository {
  /** Profile, matching inputs (city, categories, areas) and setup counters. */
  findContext(providerId: string) {
    return db.providerProfile.findUnique({
      where: { userId: providerId },
      select: {
        userId: true,
        cityId: true,
        verificationStatus: true,
        rejectionReason: true,
        ratingAvg: true,
        ratingCount: true,
        completedCount: true,
        underReview: true,
        user: { select: { name: true } },
        categories: { select: { categoryId: true } },
        areas: { select: { area: place } },
        _count: { select: { services: { where: { isActive: true } } } },
      },
    })
  }

  /** The category tree (ids + names) to expand a provider's categories to their sub-categories. */
  findCategories() {
    return db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: { id: true, parentId: true, nameEn: true, nameAr: true, isActive: true },
    })
  }

  countPendingQuotesOnOpenRequests(providerId: string) {
    return db.quote.count({ where: { providerId, status: "PENDING", request: { status: "OPEN" } } })
  }

  countBookings(providerId: string, statuses: BookingStatus[]) {
    return db.booking.count({ where: { providerId, status: { in: statuses } } })
  }

  async sumLedger(providerId: string, types: WalletTxType[] | null, range?: { from: Date; to: Date }) {
    const where: Prisma.WalletTransactionWhereInput = {
      providerId,
      ...(types ? { type: { in: types } } : {}),
      ...(range ? { createdAt: { gte: range.from, lt: range.to } } : {}),
    }
    const agg = await db.walletTransaction.aggregate({ where, _sum: { amount: true } })
    return agg._sum.amount ? Number(agg._sum.amount.toString()) : 0
  }

  findBookingsScheduledBetween(providerId: string, from: Date, to: Date, exclude: BookingStatus[]) {
    return db.booking.findMany({
      where: { providerId, scheduledAt: { gte: from, lt: to }, status: { notIn: exclude } },
      orderBy: { scheduledAt: "asc" },
      take: 20,
      select: {
        id: true,
        number: true,
        status: true,
        scheduledAt: true,
        addressSnapshot: true,
        contactUnlockedAt: true,
        customer: { select: { name: true } },
        service: { select: { title: true } },
        request: { select: { title: true } },
      },
    })
  }
}

export const providerDashboardRepository = new ProviderDashboardRepository()
