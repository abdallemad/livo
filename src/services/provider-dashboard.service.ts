import "server-only"
import type { BookingStatus } from "@prisma/client"
import { providerDashboardRepository as repo } from "@/repositories/provider-dashboard.repository"
import { requestRepository } from "@/repositories/request.repository"
import type { ProviderDashboardDto, ProviderTodayBooking } from "@/types/provider"
import { bookingPlace, firstName } from "@/utils/provider-booking"
import { zonedDayRange, zonedMonthRange } from "@/utils/zoned-time"
import { loadProviderContext, newRequestsWhere, toProviderRequestCard } from "./provider-request.service"

/**
 * `/provider` home (PR-14 simple stats, PR-03 account status; docs/provider-dashboard-requests-feature.md):
 * verification state, counters, this month's earnings, the newest matching requests and today's
 * bookings — "today" and "this month" in Cairo time. Read-only. The provider id comes from the session.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const PREVIEW_SIZE = 5

/** Bookings the provider still has to act on or carry out (PR-08). */
const ACTIVE: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"]
const NOT_TODAY: BookingStatus[] = ["CANCELLED", "REJECTED"]

export async function getProviderDashboard(providerId: string, now = new Date()): Promise<ProviderDashboardDto> {
  const ctx = await loadProviderContext(providerId)
  if (!ctx) {
    return {
      eligibility: "NO_PROFILE",
      name: null,
      verification: null,
      stats: { newRequests: 0, pendingQuotes: 0, bookingsToAccept: 0, activeBookings: 0, earningsThisMonth: 0, walletBalance: 0, completedJobs: 0, ratingAvg: 0, ratingCount: 0, underReview: false },
      newRequests: [],
      todayBookings: [],
      setup: { hasServices: false, hasAreas: false, hasCategories: false },
    }
  }
  const p = ctx.profile
  const approved = p.verificationStatus === "APPROVED"
  const today = zonedDayRange(now)
  const month = zonedMonthRange(now)
  const newWhere = newRequestsWhere(ctx, "areas", now)

  const [newCount, newRows, pendingQuotes, bookingsToAccept, activeBookings, earningsThisMonth, walletBalance, todayRows] = await Promise.all([
    approved ? requestRepository.count(newWhere) : 0,
    approved ? requestRepository.findProviderPage(providerId, newWhere, [{ createdAt: "desc" }, { id: "asc" }], 0, PREVIEW_SIZE).then(([rows]) => rows) : [],
    repo.countPendingQuotesOnOpenRequests(providerId),
    repo.countBookings(providerId, ["PENDING_PROVIDER"]),
    repo.countBookings(providerId, ACTIVE),
    repo.sumLedger(providerId, ["EARNING", "REFUND_CLAWBACK"], { from: month.start, to: month.end }),
    repo.sumLedger(providerId, null),
    repo.findBookingsScheduledBetween(providerId, today.start, today.end, NOT_TODAY),
  ])

  const todayBookings: ProviderTodayBooking[] = todayRows.map((b) => {
    const unlocked = b.contactUnlockedAt !== null
    return {
      id: b.id,
      number: b.number,
      title: b.service?.title ?? b.request?.title ?? "Booking",
      status: b.status,
      scheduledAt: b.scheduledAt!.toISOString(),
      place: bookingPlace(b.addressSnapshot, unlocked),
      customerFirstName: firstName(b.customer.name),
    }
  })

  return {
    eligibility: approved ? "OK" : "NOT_APPROVED",
    name: p.user.name,
    verification: { status: p.verificationStatus, rejectionReason: p.rejectionReason },
    stats: {
      newRequests: newCount,
      pendingQuotes,
      bookingsToAccept,
      activeBookings,
      earningsThisMonth: Math.round(earningsThisMonth * 100) / 100,
      walletBalance: Math.round(walletBalance * 100) / 100,
      completedJobs: p.completedCount,
      ratingAvg: num(p.ratingAvg),
      ratingCount: p.ratingCount,
      underReview: p.underReview,
    },
    newRequests: newRows.map((r) => toProviderRequestCard(r, ctx, now)),
    todayBookings,
    setup: { hasServices: p._count.services > 0, hasAreas: ctx.areaIds.length > 0, hasCategories: ctx.categoryIds.length > 0 },
  }
}
