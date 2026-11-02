import "server-only"
import type { Prisma } from "@prisma/client"
import { bookingChannel, parseChannel, REALTIME_EVENTS } from "@/constants/realtime"
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors"
import { isRealtimeConfigured, publish, pushNotification } from "@/lib/pusher"
import { chatRepository as repo, type ConversationRow } from "@/repositories/chat.repository"
import type { SendMessageValues } from "@/schemas/chat.schema"
import type { ChatMessageDto, ChatThreadDto, ConversationDto } from "@/types/chat"
import { canReadChat, chatClosedReason, type ChatSide, messagePreview, THREAD_LIMIT } from "@/utils/chat"
import { contactVisible } from "@/utils/customer-booking"

/**
 * Booking chat between the customer and the provider (CU-06, PR-09, SY-04; docs/messages-feature.md) and who may listen
 * on which real-time channel (docs/realtime-feature.md).
 *
 * The participant always comes from the session: the customer zone reads bookings where `customerId = me`, the provider
 * zone where `providerId = me`. A booking that isn't mine, or whose provider hasn't accepted yet, is a 404. Messages are
 * saved first; the push to the booking channel (and a toast to the other side) happens after, best effort.
 */

const sideWhere = (side: ChatSide, userId: string): Prisma.BookingWhereInput => (side === "CUSTOMER" ? { customerId: userId } : { providerId: userId })
const titleOf = (b: ConversationRow) => b.service?.title ?? b.request?.title ?? "Booking"
const otherOf = (b: ConversationRow, side: ChatSide) => (side === "CUSTOMER" ? b.provider.user : b.customer)

const toMessage = (m: { id: string; bookingId: string; senderId: string; body: string; createdAt: Date }, clientId: string | null = null): ChatMessageDto => ({
  id: m.id,
  bookingId: m.bookingId,
  senderId: m.senderId,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
  clientId,
})

export async function listConversations(userId: string, side: ChatSide): Promise<ConversationDto[]> {
  const rows = await repo.findConversations(sideWhere(side, userId))
  return rows
    .map((b): ConversationDto => {
      const last = b.messages[0]
      const other = otherOf(b, side)
      return {
        bookingId: b.id,
        number: b.number,
        title: titleOf(b),
        status: b.status,
        other: { name: other.name || (side === "CUSTOMER" ? "Your provider" : "Customer"), avatarUrl: other.avatarUrl },
        lastMessage: last ? { body: messagePreview(last.body), at: last.createdAt.toISOString(), fromMe: last.senderId === userId } : null,
        activityAt: (last?.createdAt ?? b.contactUnlockedAt!).toISOString(),
        closedReason: chatClosedReason(b.status, true),
      }
    })
    .sort((a, b) => b.activityAt.localeCompare(a.activityAt))
}

/** The thread for its page and `GET …/messages/[bookingId]`; `null` → 404 (not mine, or chat not open yet). */
export async function getThread(userId: string, side: ChatSide, bookingId: string): Promise<ChatThreadDto | null> {
  const b = await repo.findConversation(bookingId, sideWhere(side, userId))
  if (!b || !canReadChat(b.contactUnlockedAt !== null)) return null
  const other = otherOf(b, side)
  return {
    bookingId: b.id,
    number: b.number,
    title: titleOf(b),
    status: b.status,
    me: userId,
    other: {
      name: other.name || (side === "CUSTOMER" ? "Your provider" : "Customer"),
      avatarUrl: other.avatarUrl,
      // Same rule as the booking pages: phones only while a confirmed booking is live (BR-02).
      phone: contactVisible(true, b.status) ? other.phone : null,
    },
    messages: (await repo.findMessages(b.id, THREAD_LIMIT)).map((m) => toMessage(m)),
    closedReason: chatClosedReason(b.status, true),
    bookingHref: side === "CUSTOMER" ? `/account/bookings/${b.id}` : `/provider/bookings/${b.id}`,
    realtime: isRealtimeConfigured(),
  }
}

export async function sendMessage(userId: string, side: ChatSide, bookingId: string, values: SendMessageValues): Promise<ChatMessageDto> {
  const b = await repo.findConversation(bookingId, sideWhere(side, userId))
  if (!b || !canReadChat(b.contactUnlockedAt !== null)) throw new NotFoundError("That conversation doesn't exist.")
  const closed = chatClosedReason(b.status, true)
  if (closed) throw new ConflictError(closed)

  const message = toMessage(await repo.createMessage({ bookingId: b.id, senderId: userId, body: values.body }), values.clientId ?? null)

  // After the write: the open thread on both sides, and a toast for the other side wherever they are.
  const recipient = side === "CUSTOMER" ? b.providerId : b.customerId
  const me = side === "CUSTOMER" ? b.customer : b.provider.user
  await Promise.all([
    publish(bookingChannel(b.id), REALTIME_EVENTS.message, message),
    pushNotification(recipient, {
      type: "NEW_MESSAGE",
      title: `New message from ${me.name || (side === "CUSTOMER" ? "the customer" : "your provider")}`,
      body: messagePreview(values.body, 120),
      href: side === "CUSTOMER" ? `/provider/messages/${b.id}` : `/account/messages/${b.id}`,
    }),
  ])
  return message
}

/**
 * `POST /api/realtime/auth`: may this user subscribe to this channel? Their own user channel; a booking channel when
 * they're its customer or provider and the chat is open to read. Anything else → 403.
 */
export async function assertCanSubscribe(userId: string, channelName: string): Promise<void> {
  const channel = parseChannel(channelName)
  if (!channel) throw new ForbiddenError("Unknown channel.")
  if (channel.kind === "user") {
    if (channel.id !== userId) throw new ForbiddenError("Not your channel.")
    return
  }
  const b = await repo.findParticipants(channel.id)
  if (!b || (b.customerId !== userId && b.providerId !== userId) || !canReadChat(b.contactUnlockedAt !== null)) {
    throw new ForbiddenError("Not your conversation.")
  }
}
