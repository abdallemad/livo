import type { BookingStatus, DisputeStatus, VerificationStatus } from "@prisma/client"

/**
 * Admin dashboard contracts (`GET /api/admin/dashboard`). Money is a plain
 * number in EGP and dates are ISO strings, so the DTO survives JSON as-is.
 */
export interface AdminDashboardStats {
  users: { total: number; customers: number; providers: number; newLast30Days: number }
  activeProviders: number
  requests: { total: number; open: number }
  /** Sum of every booking that went ahead (not unpaid / cancelled / rejected). */
  bookingValue: number
  bookingCount: number
  /** Commission on completed and closed bookings. */
  commissionEarned: number
}

export interface AdminDashboardAttention {
  pendingProviders: number
  openDisputes: number
  payoutRequests: { count: number; amount: number }
  bookingsAwaitingProvider: number
}

export interface PendingProviderDto {
  id: string
  name: string
  city: string
  categories: string[]
  documentCount: number
  yearsExperience: number | null
  submittedAt: string
}

export interface OpenDisputeDto {
  id: string
  bookingId: string
  bookingNumber: string
  reason: string
  status: DisputeStatus
  openedBy: string
  createdAt: string
}

export interface RecentBookingDto {
  id: string
  number: string
  customer: string
  provider: string
  amount: number
  status: BookingStatus
  createdAt: string
}

export interface AdminDashboardDto {
  stats: AdminDashboardStats
  attention: AdminDashboardAttention
  pendingProviders: PendingProviderDto[]
  openDisputes: OpenDisputeDto[]
  recentBookings: RecentBookingDto[]
}

export interface ProviderDecisionDto {
  id: string
  verificationStatus: VerificationStatus
}

export interface DisputeStatusDto {
  id: string
  status: DisputeStatus
}
