import type { NotificationType, Role } from "@prisma/client"

/**
 * Where a notification takes you (SY-02; docs/notifications-feature.md) — pure and tested. Built from the row's `type`,
 * its `payload` (bookingId / requestId / …) and the recipient's role, because the same event lives on different pages per
 * zone (a booking is `/account/bookings/[id]` for the customer, `/provider/bookings/[id]` for the provider).
 */

const str = (payload: unknown, key: string): string | null => {
  if (!payload || typeof payload !== "object") return null
  const v = (payload as Record<string, unknown>)[key]
  return typeof v === "string" && v.length > 0 && v.length <= 64 ? encodeURIComponent(v) : null
}

export function notificationHref(type: NotificationType, payload: unknown, role: Role): string {
  const booking = str(payload, "bookingId")
  const request = str(payload, "requestId")
  const root = role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/account"

  if (role === "ADMIN") {
    if (booking) return `/admin/bookings/${booking}`
    if (request) return `/admin/requests/${request}`
    return root
  }
  if (role === "PROVIDER") {
    switch (type) {
      case "PROVIDER_DECISION":
        return "/provider/verification"
      case "PAYOUT_UPDATE":
        return "/provider/earnings"
      case "REVIEW_RECEIVED":
        return "/provider/reviews"
      // The request page shows the booking once the quote is accepted, even while it's unpaid (hidden from bookings).
      case "QUOTE_ACCEPTED":
      case "NEW_REQUEST_MATCH":
        return request ? `/provider/requests/${request}` : booking ? `/provider/bookings/${booking}` : "/provider/requests"
      default:
        if (booking) return `/provider/bookings/${booking}`
        if (request) return `/provider/requests/${request}`
        return root
    }
  }
  switch (type) {
    case "QUOTE_RECEIVED":
      return request ? `/account/requests/${request}` : "/account/requests"
    default:
      if (booking) return `/account/bookings/${booking}`
      if (request) return `/account/requests/${request}`
      return root
  }
}

/** "9+" keeps a badge narrow. */
export const countBadge = (n: number) => (n > 9 ? "9+" : String(n))
