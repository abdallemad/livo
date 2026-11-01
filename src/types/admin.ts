import type {
  BookingSource,
  BookingStatus,
  CategoryType,
  DisputeResolution,
  DisputeStatus,
  DocumentType,
  EscrowState,
  MilestoneStatus,
  PaymentMethod,
  PaymentStatus,
  PayoutStatus,
  QuoteStatus,
  RequestStatus,
  Role,
  UserStatus,
  VerificationStatus,
} from "@prisma/client"
import type { SettlementPayment } from "@/utils/dispute-settlement"
import type { PaymentSummary } from "@/utils/payment-summary"
import type { CommissionSource } from "@/utils/commission"
import type { ServiceVisibilityState } from "@/utils/service-visibility"
import type { Paginated } from "./api"

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

// ---------------------------------------------------------------------------
// Providers (`/admin/providers`, AD-01) and users (`/admin/users`, AD-03)
// ---------------------------------------------------------------------------

/** One row of the admin audit trail for an entity (AD-11). */
export interface AuditEntryDto {
  id: string
  action: string
  actor: string | null
  /** `metadata.reason`, when the decision carried one. */
  reason: string | null
  createdAt: string
}

export interface AdminProviderListItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  city: string
  categories: string[]
  verificationStatus: VerificationStatus
  documentCount: number
  serviceCount: number
  ratingAvg: number
  ratingCount: number
  /** Last profile change — for PENDING rows, when it was submitted for review. */
  updatedAt: string
}

export interface AdminProviderList extends Paginated<AdminProviderListItem> {
  /** Rows per verification status, for the tab badges. */
  counts: Record<VerificationStatus, number>
}

export interface AdminProviderDocumentDto {
  id: string
  type: DocumentType
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  /** Admin-only preview route (307 to a 5-minute signed link). */
  url: string
}

export interface AdminProviderServiceDto {
  id: string
  title: string
  category: string
  price: number
  isActive: boolean
  imageCount: number
}

export interface AdminProviderDetail {
  id: string
  name: string
  phone: string | null
  email: string | null
  avatarUrl: string | null
  userStatus: UserStatus
  joinedAt: string
  verificationStatus: VerificationStatus
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  bio: string | null
  yearsExperience: number | null
  city: string
  areas: string[]
  categories: string[]
  ratingAvg: number
  ratingCount: number
  completedCount: number
  underReview: boolean
  portfolioCount: number
  documents: AdminProviderDocumentDto[]
  services: AdminProviderServiceDto[]
  history: AuditEntryDto[]
}

export interface AdminUserListItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: Role
  status: UserStatus
  city: string | null
  onboardingCompleted: boolean
  joinedAt: string
}

export interface AdminUserDetail extends AdminUserListItem {
  avatarUrl: string | null
  deletedAt: string | null
  /** Reason from the latest `user.suspend` audit entry while suspended. */
  suspensionReason: string | null
  provider: { verificationStatus: VerificationStatus } | null
  counts: {
    requests: number
    bookingsAsCustomer: number
    bookingsAsProvider: number
    reviewsWritten: number
    disputesOpened: number
  }
  recentBookings: (RecentBookingDto & { side: "CUSTOMER" | "PROVIDER" })[]
  history: AuditEntryDto[]
}

export interface UserStatusDto {
  id: string
  status: UserStatus
}

// ---------------------------------------------------------------------------
// Catalog: categories and services (`/admin/categories`, `/admin/services`, AD-02)
// ---------------------------------------------------------------------------

export interface AdminCategoryListItem {
  id: string
  slug: string
  nameEn: string | null
  nameAr: string
  type: CategoryType
  iconKey: string | null
  isActive: boolean
  sortOrder: number
  parentId: string | null
  parentName: string | null
  counts: { children: number; services: number; liveServices: number; providers: number; requests: number }
}

/** The edit form's values (plus what the form shows read-only). */
export interface AdminCategoryDetail {
  id: string
  slug: string
  nameEn: string
  nameAr: string
  description: string | null
  type: CategoryType
  iconKey: string | null
  parentId: string | null
  isActive: boolean
  sortOrder: number
  hasChildren: boolean
}

export interface CategoryOptionDto {
  id: string
  name: string
}


export interface AdminServiceListItem {
  id: string
  slug: string
  title: string
  description: string
  price: number
  durationMinutes: number | null
  category: string
  categoryActive: boolean
  providerId: string
  providerName: string
  providerStatus: VerificationStatus
  isActive: boolean
  hiddenByAdminAt: string | null
  hiddenByAdminReason: string | null
  imageCount: number
  bookingCount: number
  visibility: ServiceVisibilityState
  createdAt: string
}

export interface ServiceModerationDto {
  id: string
  hiddenByAdminAt: string | null
}

// ---------------------------------------------------------------------------
// Requests & bookings (`/admin/requests`, `/admin/bookings`, AD-04)
// ---------------------------------------------------------------------------

export interface AdminRequestListItem {
  id: string
  title: string
  customerId: string
  customerName: string
  category: string
  area: string | null
  city: string
  budget: number | null
  status: RequestStatus
  quoteCount: number
  pendingQuoteCount: number
  preferredDate: string | null
  expiresAt: string | null
  createdAt: string
}

export interface AdminQuoteDto {
  id: string
  providerId: string
  providerName: string
  price: number
  durationDays: number | null
  message: string | null
  status: QuoteStatus
  validUntil: string | null
  createdAt: string
  bookingId: string | null
}

export interface AdminRequestDetail extends AdminRequestListItem {
  description: string
  mediaCount: number
  address: string | null
  quotes: AdminQuoteDto[]
  bookings: { id: string; number: string; status: BookingStatus }[]
  history: AuditEntryDto[]
}

export interface AdminBookingListItem {
  id: string
  number: string
  source: BookingSource
  title: string
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  amount: number
  commissionAmount: number
  status: BookingStatus
  paymentMethod: PaymentMethod | null
  escrowState: EscrowState | null
  scheduledAt: string | null
  createdAt: string
}

export interface AdminPaymentDto {
  id: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  escrowState: EscrowState
  refundedAmount: number
  milestone: string | null
  gatewayRef: string | null
  paidAt: string | null
  releasedAt: string | null
  createdAt: string
}

export interface AdminBookingEvent {
  key: string
  label: string
  at: string
  /** A deadline that hasn't passed yet (e.g. auto-release). */
  upcoming?: boolean
}

export interface AdminBookingDetail extends AdminBookingListItem {
  commissionRate: number
  providerNet: number
  notes: string | null
  address: string | null
  serviceId: string | null
  requestId: string | null
  contactUnlocked: boolean
  cancelReason: string | null
  cancelledBy: string | null
  /** Admin may cancel only while no money has been captured (see admin-booking.service.ts). */
  canCancel: boolean
  cancelBlockedReason: string | null
  events: AdminBookingEvent[]
  payments: AdminPaymentDto[]
  milestones: { id: string; title: string; amount: number; status: MilestoneStatus; dueAt: string | null }[]
  messages: { id: string; senderSide: "CUSTOMER" | "PROVIDER" | "OTHER"; senderName: string; body: string; contactBlocked: boolean; createdAt: string }[]
  reviews: { id: string; byProvider: boolean; rating: number; comment: string | null; isHidden: boolean; createdAt: string }[]
  dispute: { id: string; status: DisputeStatus; reason: string } | null
  history: AuditEntryDto[]
}

export interface AdminRequestList extends Paginated<AdminRequestListItem> {
  counts: Record<RequestStatus, number>
}

export interface AdminBookingList extends Paginated<AdminBookingListItem> {
  counts: Record<BookingStatus, number>
}

// ---------------------------------------------------------------------------
// Disputes (`/admin/disputes`, AD-05) and reviews (`/admin/reviews`, AD-08)
// ---------------------------------------------------------------------------

export type AdminMessageDto = AdminBookingDetail["messages"][number]

export interface AdminDisputeListItem {
  id: string
  bookingId: string
  bookingNumber: string
  reason: string
  status: DisputeStatus
  resolution: DisputeResolution | null
  openedBySide: "CUSTOMER" | "PROVIDER" | "OTHER"
  openedByName: string
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  amount: number
  /** Online money Livo still holds for the booking. */
  held: number
  evidenceCount: number
  createdAt: string
  resolvedAt: string | null
}

export interface AdminDisputeList extends Paginated<AdminDisputeListItem> {
  counts: Record<DisputeStatus, number>
}

export interface AdminDisputeDetail extends AdminDisputeListItem {
  resolutionNote: string | null
  refundAmount: number | null
  resolvedBy: string | null
  booking: {
    status: BookingStatus
    source: BookingSource
    title: string
    commissionRate: number
    scheduledAt: string | null
    completedAt: string | null
  }
  payments: (SettlementPayment & { method: PaymentMethod; milestone: string | null })[]
  /** EARNING + REFUND_CLAWBACK already credited for this booking — feeds the settlement preview. */
  walletCreditedSoFar: number
  availableResolutions: DisputeResolution[]
  evidence: { id: string; mimeType: string; sizeBytes: number; createdAt: string; url: string }[]
  messages: AdminMessageDto[]
  history: AuditEntryDto[]
}

export interface AdminReviewListItem {
  id: string
  rating: number
  comment: string | null
  providerReply: string | null
  isHidden: boolean
  /** True when the reviewee is the booking's provider (customer → provider). */
  ofProvider: boolean
  reviewerId: string
  reviewerName: string
  revieweeId: string
  revieweeName: string
  bookingId: string
  bookingNumber: string
  createdAt: string
}

export interface AdminReviewList extends Paginated<AdminReviewListItem> {
  hiddenCount: number
}

// ---------------------------------------------------------------------------
// Payments (`/admin/payments`, AD-07) — docs/admin-payments-feature.md
// ---------------------------------------------------------------------------

export interface AdminPaymentListItem {
  id: string
  method: PaymentMethod
  amount: number
  refundedAmount: number
  status: PaymentStatus
  escrowState: EscrowState
  milestone: string | null
  gatewayRef: string | null
  paidAt: string | null
  releasedAt: string | null
  createdAt: string
  bookingId: string
  bookingNumber: string
  bookingStatus: BookingStatus
  bookingTitle: string
  /** Percent, from the booking's frozen snapshot (BR-01). */
  commissionRate: number
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  /** An open (not resolved) dispute on the booking freezes its money. */
  dispute: { id: string; status: DisputeStatus } | null
}

export interface AdminPaymentList extends Paginated<AdminPaymentListItem> {
  counts: Record<PaymentStatus, number>
  /** Totals over ALL payments (not the filtered page) — `utils/payment-summary.ts`. */
  summary: PaymentSummary
}

// ---------------------------------------------------------------------------
// Commission (`/admin/settings/commission`, AD-06) and payouts (`/admin/payouts`, AD-07)
// docs/admin-commission-payouts-feature.md
// ---------------------------------------------------------------------------

export interface AdminCommissionCategory {
  id: string
  name: string
  parentId: string | null
  parentName: string | null
  isActive: boolean
  /** This category's own override, if any. */
  overrideRate: number | null
  /** What a booking confirmed now would be charged (`utils/commission.ts`). */
  effectiveRate: number
  source: CommissionSource
}

export interface AdminCommissionChange {
  id: string
  action: string
  actor: string | null
  categoryName: string | null
  from: number | null
  to: number | null
  createdAt: string
}

export interface AdminCommissionSettings {
  globalRate: number
  globalUpdatedAt: string | null
  /** Parents first, each followed by its sub-categories. */
  categories: AdminCommissionCategory[]
  history: AdminCommissionChange[]
}

export interface AdminPayoutWallet {
  /** `SUM(WalletTransaction.amount)` — may be negative (cash-job commission owed). */
  balance: number
  /** Other APPROVED-but-unpaid payouts of this provider. */
  reservedByOthers: number
  available: number
}

export interface AdminPayoutListItem {
  id: string
  amount: number
  status: PayoutStatus
  destinationType: string
  destinationRef: string
  providerId: string
  providerName: string
  providerPhone: string | null
  rejectionReason: string | null
  processedBy: string | null
  processedAt: string | null
  createdAt: string
  /** Only for REQUESTED / APPROVED payouts (final ones don't need it). */
  wallet: AdminPayoutWallet | null
  /** `null` = allowed; otherwise why the button is disabled (`utils/payout-rules.ts`). */
  approveBlockedReason: string | null
  markPaidBlockedReason: string | null
  canReject: boolean
}

export interface AdminPayoutList extends Paginated<AdminPayoutListItem> {
  counts: Record<PayoutStatus, number>
  amounts: Record<PayoutStatus, number>
}

export interface PayoutStatusDto {
  id: string
  status: PayoutStatus
}
