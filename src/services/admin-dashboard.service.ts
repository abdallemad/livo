import "server-only"
import type { BookingStatus } from "@prisma/client"
import { adminDashboardRepository as repo } from "@/repositories/admin-dashboard.repository"
import type { AdminDashboardDto } from "@/types/admin"

/**
 * `/admin` KPIs and work queues (AD-09, docs/admin-dashboard-feature.md).
 * Read by the page directly (CLAUDE.md §2 read-only exception, for the first
 * paint) and by `GET /api/admin/dashboard` (refetch after an action).
 * Callers must already have passed `requireAdmin()` / the admin layout gate.
 */

/** Bookings that actually went ahead — counted in booking value. */
const BOOKED_STATUSES: BookingStatus[] = [
  "PENDING_PROVIDER",
  "CONFIRMED",
  "IN_PROGRESS",
  "AWAITING_CONFIRMATION",
  "COMPLETED",
  "CLOSED",
  "DISPUTED",
]
/** Commission is only "earned" once the customer confirmed the job (CU-09). */
const EARNED_STATUSES: BookingStatus[] = ["COMPLETED", "CLOSED"]

const LIST_SIZE = 5
const NEW_USER_WINDOW_DAYS = 30

const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr
const money = (value: { toString(): string } | null | undefined) => (value ? Number(value.toString()) : 0)

export async function getAdminDashboard(): Promise<AdminDashboardDto> {
  const since = new Date(Date.now() - NEW_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [counts, pendingProviders, openDisputes, recentBookings] = await Promise.all([
    repo.counts({ since, bookedStatuses: BOOKED_STATUSES, earnedStatuses: EARNED_STATUSES }),
    repo.findPendingProviders(LIST_SIZE),
    repo.findOpenDisputes(LIST_SIZE),
    repo.findRecentBookings(LIST_SIZE),
  ])
  const [
    users,
    customers,
    providers,
    newUsers,
    activeProviders,
    requests,
    openRequests,
    booked,
    earned,
    pendingProviderCount,
    openDisputeCount,
    payouts,
    awaitingProvider,
  ] = counts

  return {
    stats: {
      users: { total: users, customers, providers, newLast30Days: newUsers },
      activeProviders,
      requests: { total: requests, open: openRequests },
      bookingValue: money(booked._sum.amount),
      bookingCount: booked._count,
      commissionEarned: money(earned._sum.commissionAmount),
    },
    attention: {
      pendingProviders: pendingProviderCount,
      openDisputes: openDisputeCount,
      payoutRequests: { count: payouts._count, amount: money(payouts._sum.amount) },
      bookingsAwaitingProvider: awaitingProvider,
    },
    pendingProviders: pendingProviders.map((p) => ({
      id: p.userId,
      name: p.user.name || "Unnamed provider",
      city: label(p.city),
      categories: p.categories.map((c) => label(c.category)),
      documentCount: p._count.documents,
      yearsExperience: p.yearsExperience,
      submittedAt: p.updatedAt.toISOString(),
    })),
    openDisputes: openDisputes.map((d) => ({
      id: d.id,
      bookingId: d.booking.id,
      bookingNumber: d.booking.number,
      reason: d.reason,
      status: d.status,
      openedBy: d.openedBy.name || "Unknown user",
      createdAt: d.createdAt.toISOString(),
    })),
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      number: b.number,
      customer: b.customer.name || "Unknown customer",
      provider: b.provider.user.name || "Unknown provider",
      amount: money(b.amount),
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    })),
  }
}
