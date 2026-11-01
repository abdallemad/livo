import type { QuoteStatus, RequestStatus } from "@prisma/client"

/**
 * Quote rules for the provider (PR-07, docs/provider-quotes-bookings-feature.md). Pure and tested.
 * A provider may withdraw a quote only while it is still waiting and the request is still open —
 * once the customer has chosen (or the request closed), the quote is history.
 */
export function quoteWithdrawBlockedReason(quote: QuoteStatus, request: RequestStatus): string | null {
  if (quote === "ACCEPTED") return "The customer accepted this quote — it's a booking now."
  if (quote !== "PENDING") return "This quote is already closed."
  if (request !== "OPEN") return "The request is closed, so the quote can't change."
  return null
}
