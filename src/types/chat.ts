import type { BookingStatus } from "@prisma/client"

/** Booking chat DTOs (CU-06, PR-09) — docs/messages-feature.md. Safe for the browser; also the Pusher payload. */

export interface ChatMessageDto {
  id: string
  bookingId: string
  senderId: string
  body: string
  createdAt: string
  /** Echo of the sender's `clientId`, if any (de-duplicates the optimistic bubble). */
  clientId: string | null
}

export interface ConversationDto {
  bookingId: string
  number: string
  title: string
  status: BookingStatus
  /** The other side: the provider for a customer, the customer for a provider. */
  other: { name: string; avatarUrl: string | null }
  lastMessage: { body: string; at: string; fromMe: boolean } | null
  /** Last message time, or when the booking was accepted. */
  activityAt: string
  closedReason: string | null
  /** Messages from the other side I haven't read yet. */
  unread: number
}

/** `GET …/messages/unread` — the sidebar badge (docs/messages-feature.md). */
export interface UnreadMessagesDto {
  total: number
}

export interface ChatThreadDto {
  bookingId: string
  number: string
  title: string
  status: BookingStatus
  me: string
  other: { name: string; avatarUrl: string | null; phone: string | null }
  messages: ChatMessageDto[]
  /** `null` = can send. */
  closedReason: string | null
  /** Where "booking details" links to for this side. */
  bookingHref: string
  /** Whether the browser should expect live pushes (otherwise it polls). */
  realtime: boolean
}
