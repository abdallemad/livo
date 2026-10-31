import "server-only"
import type { BookingStatus } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * Read-only queries behind the admin dashboard (docs/admin-dashboard-feature.md).
 * Dumb queries only; which statuses count as "booked" or "earned" is decided
 * by `admin-dashboard.service.ts` and passed in.
 */
class AdminDashboardRepository {
  /** Every KPI in one transaction, so the numbers on screen come from one consistent snapshot. */
  counts(input: { since: Date; bookedStatuses: BookingStatus[]; earnedStatuses: BookingStatus[] }) {
    const notDeleted = { status: { not: "DELETED" as const } }
    return db.$transaction([
      db.user.count({ where: notDeleted }),
      db.user.count({ where: { ...notDeleted, role: "CUSTOMER" } }),
      db.user.count({ where: { ...notDeleted, role: "PROVIDER" } }),
      db.user.count({ where: { ...notDeleted, createdAt: { gte: input.since } } }),
      db.providerProfile.count({ where: { verificationStatus: "APPROVED" } }),
      db.serviceRequest.count({ where: { status: { not: "DRAFT" } } }),
      db.serviceRequest.count({ where: { status: "OPEN" } }),
      db.booking.aggregate({ where: { status: { in: input.bookedStatuses } }, _sum: { amount: true }, _count: true }),
      db.booking.aggregate({ where: { status: { in: input.earnedStatuses } }, _sum: { commissionAmount: true } }),
      db.providerProfile.count({ where: { verificationStatus: "PENDING" } }),
      db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      db.payout.aggregate({ where: { status: "REQUESTED" }, _sum: { amount: true }, _count: true }),
      db.booking.count({ where: { status: "PENDING_PROVIDER" } }),
    ])
  }

  /** Oldest first: whoever has waited longest is reviewed first. */
  findPendingProviders(take: number) {
    return db.providerProfile.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { updatedAt: "asc" },
      take,
      select: {
        userId: true,
        yearsExperience: true,
        updatedAt: true,
        user: { select: { name: true } },
        city: { select: { nameEn: true, nameAr: true } },
        categories: { select: { category: { select: { nameEn: true, nameAr: true } } } },
        _count: { select: { documents: true } },
      },
    })
  }

  findOpenDisputes(take: number) {
    return db.dispute.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        booking: { select: { id: true, number: true } },
        openedBy: { select: { name: true } },
      },
    })
  }

  findRecentBookings(take: number) {
    return db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        number: true,
        amount: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
        provider: { select: { user: { select: { name: true } } } },
      },
    })
  }
}

export const adminDashboardRepository = new AdminDashboardRepository()
