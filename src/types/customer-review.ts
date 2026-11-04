import type { BookingStatus } from "@prisma/client"

/**
 * `GET /api/me/bookings/[id]/review` — everything `/account/bookings/[id]/review` needs (CU-10;
 * docs/customer-review-feature.md). Importable by the browser.
 */
export interface CustomerBookingReview {
  booking: {
    id: string
    number: string
    title: string
    status: BookingStatus
    /** When the customer confirmed (or the booking auto-closed); ISO. */
    completedAt: string | null
  }
  provider: { id: string; name: string; avatarUrl: string | null }
  /** `null` while the booking can be rated; otherwise the sentence the page shows instead of the form. */
  blockedReason: string | null
  review: CustomerReviewDto | null
}

export interface CustomerReviewDto {
  id: string
  rating: number
  comment: string | null
  providerReply: string | null
  isHidden: boolean
  createdAt: string
  updatedAt: string
  /** Changed after it was first posted. */
  edited: boolean
  /** `null` while it can still be edited; otherwise why not. */
  editBlockedReason: string | null
  /** Last moment it can be edited; ISO. */
  editableUntil: string
}

/** What `PUT /api/me/bookings/[id]/review` answers. */
export interface CustomerReviewSaveDto {
  review: CustomerReviewDto
  created: boolean
}
