import type { BookingStatus, RequestStatus } from "@prisma/client"
import type { WorkStatus } from "@/constants/status"
import type { Paginated } from "./api"

/** Customer dashboard & requests (CU-08, CU-11, CU-13) — docs/customer-dashboard-requests-feature.md. Money in EGP. */

export interface CustomerRequestCard {
  id: string
  title: string
  description: string
  category: string
  parentCategory: string | null
  area: string | null
  status: RequestStatus
  /** What the customer sees: "Quotes received" for an open request with quotes waiting. */
  state: WorkStatus
  budget: number | null
  preferredDate: string | null
  expiresAt: string | null
  /** Local (Cairo) days until it closes (BR-05); computed on the server so the render is stable. */
  expiresInDays: number | null
  createdAt: string
  photoCount: number
  quoteCount: number
  /** Quotes still waiting for the customer's decision. */
  pendingQuotes: number
  lowestPendingPrice: number | null
  booking: { id: string; number: string; status: BookingStatus } | null
  /** `null` = can be cancelled. */
  cancelBlockedReason: string | null
}

export interface CustomerRequestList extends Paginated<CustomerRequestCard> {
  counts: Record<"active" | "booked" | "closed", number>
}

export interface CustomerBookingCard {
  id: string
  number: string
  title: string
  status: BookingStatus
  scheduledAt: string | null
  providerName: string
  amount: number
  /** Objection-window deadline while the customer must confirm (BR-08). */
  autoReleaseAt: string | null
}

export type AttentionKind = "CONFIRM_DONE" | "PAY" | "COMPARE_QUOTES" | "REVIEW"

export interface AttentionItem {
  kind: AttentionKind
  id: string
  title: string
  href: string
  /** One sentence: what to do and by when. */
  detail: string
  at: string | null
}

export interface CustomerDashboardDto {
  name: string | null
  stats: { upcomingBookings: number; openRequests: number; quotesWaiting: number; toReview: number }
  attention: AttentionItem[]
  upcoming: CustomerBookingCard[]
  openRequests: CustomerRequestCard[]
}

// --- new quote request (CU-03) — docs/customer-new-request-feature.md ---------------------

export interface RequestPhotoDto {
  id: string
  mimeType: string
  sizeBytes: number
  /** Owner-only `/api/me/files/[id]` (a short-lived signed redirect). Never a public URL. */
  previewUrl: string
}

export interface NewRequestCategoryOption {
  id: string
  name: string
  parentName: string | null
}

export interface NewRequestAddressOption {
  id: string
  label: string
  areaId: string | null
  isDefault: boolean
}

export interface NewRequestFormData {
  city: string | null
  categories: NewRequestCategoryOption[]
  addresses: NewRequestAddressOption[]
  areas: { id: string; name: string }[]
  /** Photos uploaded but not yet attached to a request (resume after a refresh). */
  pendingPhotos: RequestPhotoDto[]
  /** From `?category=<slug>` when it names a quote category. */
  preselectedCategoryId: string | null
  /** Today in Cairo ("YYYY-MM-DD"), the date input's minimum. */
  today: string
  maxDate: string
  expiryDays: number
}
