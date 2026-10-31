import type { BookingStatus, EscrowState, PaymentStatus } from "@prisma/client"

/**
 * Pure booking rules for the admin screens (docs/admin-requests-bookings-feature.md),
 * kept out of the service so they are unit tested.
 */

/** Statuses an admin may cancel from: nothing has started yet. */
export const ADMIN_CANCELLABLE_BOOKING: BookingStatus[] = ["PENDING_PAYMENT", "PENDING_PROVIDER", "CONFIRMED"]

/**
 * Why an admin can't cancel this booking from the booking page, or `null` if
 * they can. Once money has been captured, cancelling is a refund decision
 * (BR-06 / BR-08) and goes through a dispute, so it is blocked here.
 */
export function adminCancelBlockedReason(
  status: BookingStatus,
  payments: { status: PaymentStatus; escrowState: EscrowState }[],
): string | null {
  if (status === "CANCELLED" || status === "REJECTED") return "The booking is already closed."
  if (status === "DISPUTED") return "There's an open dispute; resolve it on the dispute page."
  if (!ADMIN_CANCELLABLE_BOOKING.includes(status)) return "The work has started or finished; use a dispute to settle it."
  const captured = payments.some(
    (p) => p.status === "PAID" || p.status === "PARTIALLY_REFUNDED" || p.escrowState === "HELD" || p.escrowState === "RELEASED",
  )
  if (captured) return "The customer has already paid; a refund must go through a dispute."
  return null
}

export interface BookingTimestamps {
  createdAt: Date
  contactUnlockedAt: Date | null
  startedAt: Date | null
  providerCompletedAt: Date | null
  completedAt: Date | null
  autoReleaseAt: Date | null
  cancelledAt: Date | null
}

/** Every timestamp the booking has, oldest first; a future auto-release shows as upcoming. */
export function bookingEvents(b: BookingTimestamps, now: Date = new Date()) {
  const events: { key: string; label: string; at: Date; upcoming?: boolean }[] = [{ key: "created", label: "Booking placed", at: b.createdAt }]
  if (b.contactUnlockedAt) events.push({ key: "confirmed", label: "Confirmed — contact details unlocked", at: b.contactUnlockedAt })
  if (b.startedAt) events.push({ key: "started", label: "Work started", at: b.startedAt })
  if (b.providerCompletedAt) events.push({ key: "provider-done", label: "Provider marked the job done", at: b.providerCompletedAt })
  if (b.completedAt) events.push({ key: "completed", label: "Customer confirmed completion", at: b.completedAt })
  if (b.autoReleaseAt && !b.completedAt) {
    events.push({ key: "auto-release", label: "Payment auto-releases (objection window ends)", at: b.autoReleaseAt, upcoming: b.autoReleaseAt > now })
  }
  if (b.cancelledAt) events.push({ key: "cancelled", label: "Cancelled", at: b.cancelledAt })
  return events.sort((x, y) => x.at.getTime() - y.at.getTime())
}

/** `Booking.addressSnapshot` is JSON; show whatever address parts it has. */
export function formatAddressSnapshot(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  const s = snapshot as Record<string, unknown>
  const parts = ["street", "details", "area", "city"].map((k) => s[k]).filter((v): v is string => typeof v === "string" && v.trim() !== "")
  return parts.length ? parts.join(", ") : null
}
