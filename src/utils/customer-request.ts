import type { RequestStatus } from "@prisma/client"
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
