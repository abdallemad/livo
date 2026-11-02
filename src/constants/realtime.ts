/**
 * Pusher channel and event names, shared by the server (publish, authorize) and the browser (subscribe) —
 * docs/realtime-feature.md. Every channel is **private-**: the browser must get a signature from
 * `POST /api/realtime/auth`, which checks the signed-in user may listen.
 */

/** One per user: their live notifications (a quote arrived, a new chat message…). */
export const userChannel = (userId: string) => `private-user-${userId}`
/** One per booking: its chat, for the customer and the provider of that booking. */
export const bookingChannel = (bookingId: string) => `private-booking-${bookingId}`

export const REALTIME_EVENTS = {
  notification: "notification",
  message: "message",
} as const

export type RealtimeChannel = { kind: "user"; id: string } | { kind: "booking"; id: string }

/** Which channel a name refers to, or `null` for anything we don't publish on (refused by the auth endpoint). */
export function parseChannel(name: string): RealtimeChannel | null {
  const m = /^private-(user|booking)-([A-Za-z0-9_]{1,64})$/.exec(name)
  return m ? { kind: m[1] as "user" | "booking", id: m[2] } : null
}

/** What a `notification` event carries: enough for a toast with a link. */
export interface LiveNotification {
  type: "QUOTE_RECEIVED" | "NEW_MESSAGE"
  title: string
  body: string | null
  href: string
}
