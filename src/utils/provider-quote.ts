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

// --- sending / editing a quote from `/provider/requests/[id]` — docs/provider-request-detail-feature.md ---------------

export const QUOTE_PRICE_MIN = 50
export const QUOTE_PRICE_MAX = 5_000_000
export const QUOTE_DURATION_MAX_DAYS = 365
export const QUOTE_MESSAGE_MAX = 1000
export const QUOTE_VALID_DAYS = [3, 7, 14, 30] as const
export const QUOTE_VALID_DAYS_DEFAULT = 7

export interface QuoteSendCheck {
  approved: boolean
  requestStatus: RequestStatus
  requestExpired: boolean
  /** My current quote on the request, if any. */
  existing: QuoteStatus | null
  ownRequest: boolean
}

/**
 * `null` when the provider may send (or change) a quote now, otherwise the sentence shown (409 on the server).
 * One quote per provider per request (`@@unique([requestId, providerId])`): a waiting quote is **edited**, a withdrawn or
 * expired one is **sent again** on the same row; an accepted or not-chosen one is final.
 */
export function quoteSendBlockedReason(c: QuoteSendCheck): string | null {
  if (c.ownRequest) return "This is your own request."
  if (!c.approved) return "Your account isn't active, so you can't send quotes right now."
  if (c.existing === "ACCEPTED") return "The customer accepted your quote — it's a booking now."
  if (c.existing === "REJECTED") return "The customer chose another quote."
  if (c.requestStatus !== "OPEN" || c.requestExpired) return "This request is closed, so quotes can't be sent."
  return null
}

/** What a send does: a new quote, an edit of my waiting quote, or sending again after withdrawing / expiry. */
export function quoteSendMode(existing: QuoteStatus | null): "CREATE" | "UPDATE" | "RESEND" {
  if (!existing) return "CREATE"
  return existing === "PENDING" ? "UPDATE" : "RESEND"
}

export const quoteValidUntil = (now: Date, days: number) => new Date(now.getTime() + days * 86_400_000)
