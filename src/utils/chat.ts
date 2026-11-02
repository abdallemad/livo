import type { BookingStatus } from "@prisma/client"

/**
 * Booking chat rules (CU-06, PR-09, SY-04, BR-02; docs/messages-feature.md) — pure and tested.
 *
 * Chat exists only for a booking the provider **accepted** (`contactUnlockedAt` set): before that, phone numbers and
 * emails must stay hidden (SY-04), and a chat would be the easiest way around it. While the job is live both sides can
 * write; once it's finished, cancelled or under dispute the thread stays readable but closed (the dispute is handled by
 * Livo — docs/admin-disputes-reviews-feature.md).
 */

export const MESSAGE_MAX = 2000
/** How many messages a thread loads (newest kept). */
export const THREAD_LIMIT = 200

export type ChatSide = "CUSTOMER" | "PROVIDER"

export const CHAT_OPEN_STATUSES: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"]

export const canReadChat = (contactUnlocked: boolean) => contactUnlocked

/** `null` when the participant can send now, otherwise the sentence shown under the composer (409 on the server). */
export function chatClosedReason(status: BookingStatus, contactUnlocked: boolean): string | null {
  if (!contactUnlocked) return "Chat opens once the provider accepts the booking."
  if (CHAT_OPEN_STATUSES.includes(status)) return null
  if (status === "DISPUTED") return "There's an open dispute. Our team is handling it, so the chat is paused."
  if (status === "CANCELLED" || status === "REJECTED") return "This booking was cancelled, so the chat is closed."
  return "This job is finished, so the chat is closed."
}

/** One line for the conversation list: trimmed, single-spaced, cut at a word boundary. */
export function messagePreview(body: string, max = 90): string {
  const flat = body.replace(/\s+/g, " ").trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** Insert or replace a message by id or by the sender's `clientId` (optimistic bubble ↔ saved / pushed copy), in time order. */
export function mergeMessage<T extends { id: string; clientId: string | null; createdAt: string }>(list: T[], m: T): T[] {
  const i = list.findIndex((x) => x.id === m.id || (m.clientId !== null && x.clientId === m.clientId))
  const next = i >= 0 ? list.map((x, j) => (j === i ? m : x)) : [...list, m]
  return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
