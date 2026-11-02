import type { BookingStatus, QuoteStatus, RequestStatus } from "@prisma/client"
import type { WorkStatus } from "@/constants/status"

/**
 * The customer's view of their quote requests (CU-08, CU-11, CU-13; docs/customer-dashboard-requests-feature.md)
 * — pure and tested.
 */

export const CUSTOMER_REQUEST_TABS = {
  active: ["DRAFT", "OPEN"],
  booked: ["ACCEPTED"],
  closed: ["CANCELLED", "EXPIRED"],
} as const satisfies Record<string, RequestStatus[]>

export type CustomerRequestTab = keyof typeof CUSTOMER_REQUEST_TABS

/** The state the customer sees (SRS 2.3): an open request with quotes waiting reads "Quotes received". */
export function customerRequestState(status: RequestStatus, pendingQuotes: number): WorkStatus {
  if (status === "OPEN" && pendingQuotes > 0) return "QUOTES_RECEIVED"
  return status === "ACCEPTED" ? "ACCEPTED" : status
}

/**
 * A customer may cancel their own request while it's a draft or open (CU-11). Once a quote was
 * accepted it's a booking — that one is cancelled from the booking (BR-06 policy).
 */
export function requestCancelBlockedReason(status: RequestStatus): string | null {
  if (status === "DRAFT" || status === "OPEN") return null
  if (status === "ACCEPTED") return "You accepted a quote, so this is a booking now. Cancel it from the booking instead."
  return "This request is already closed."
}

/** "3 quotes from 1,200 EGP": the lowest waiting price, to help compare (CU-04). */
export function lowestPrice(prices: number[]): number | null {
  return prices.length ? Math.min(...prices) : null
}

// --- request details (CU-04, CU-05, CU-08) — docs/customer-request-detail-feature.md -------------------------

/**
 * `null` when the customer may accept this quote (CU-05), otherwise the sentence shown (409 on the server).
 * The request must still be open, the quote still waiting and valid, and the provider still able to work.
 */
export function quoteAcceptBlockedReason(input: {
  requestStatus: RequestStatus
  quoteStatus: QuoteStatus
  validUntil: Date | null
  providerActive: boolean
  now: Date
}): string | null {
  if (input.requestStatus === "ACCEPTED") return "You already accepted a quote on this request."
  if (input.requestStatus !== "OPEN") return "This request is closed, so quotes can't be accepted."
  if (input.quoteStatus !== "PENDING") return "This quote isn't available any more."
  if (input.validUntil && input.validUntil.getTime() < input.now.getTime()) return "This quote has expired. Ask the provider for a new one."
  if (!input.providerActive) return "This provider can't take new work right now. Choose another quote."
  return null
}

export const QUOTE_SORTS = ["price", "rating", "newest"] as const
export type QuoteSort = (typeof QUOTE_SORTS)[number]

/** Compare quotes (CU-04): cheapest first, best rated first (more reviews break ties), or newest first. */
export function sortQuotes<T extends { price: number; createdAt: string; provider: { rating: number; reviewsCount: number } }>(quotes: T[], sort: QuoteSort): T[] {
  const by: Record<QuoteSort, (a: T, b: T) => number> = {
    price: (a, b) => a.price - b.price || b.provider.rating - a.provider.rating,
    rating: (a, b) => b.provider.rating - a.provider.rating || b.provider.reviewsCount - a.provider.reviewsCount || a.price - b.price,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  }
  return [...quotes].sort(by[sort])
}

/**
 * Where the job is on the shared request → booking timeline (SITEMAP §7, `BookingTimeline`):
 * Open → Accepted → Payment held → In progress → Completed → Reviewed, or an exception.
 */
export function requestTimelineState(input: {
  status: RequestStatus
  booking: { status: BookingStatus; paidOnline: boolean; reviewed: boolean } | null
}): WorkStatus {
  const { status, booking } = input
  if (status === "CANCELLED" || status === "EXPIRED") return status
  if (status !== "ACCEPTED" || !booking) return "OPEN"
  switch (booking.status) {
    case "CANCELLED":
    case "REJECTED":
      return "CANCELLED"
    case "DISPUTED":
      return "DISPUTED"
    case "IN_PROGRESS":
    case "AWAITING_CONFIRMATION":
      return "IN_PROGRESS"
    case "COMPLETED":
    case "CLOSED":
      return booking.reviewed ? "REVIEWED" : "COMPLETED"
    default:
      return booking.paidOnline ? "PAID" : "ACCEPTED"
  }
}
