import type {
  BookingSource,
  BookingStatus,
  CategoryType,
  DisputeStatus,
  DocumentType,
  EscrowState,
  MilestoneStatus,
  PaymentMethod,
  PaymentStatus,
  QuoteStatus,
  RequestStatus,
  Role,
  UserStatus,
  VerificationStatus,
} from "@prisma/client"
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
