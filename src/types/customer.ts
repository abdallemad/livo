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
