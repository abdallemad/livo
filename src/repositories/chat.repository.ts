import "server-only"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

const person = { select: { name: true, avatarUrl: true, phone: true } } as const

const conversationSelect = {
  id: true,
  number: true,
  status: true,
  customerId: true,
  providerId: true,
  contactUnlockedAt: true,
  service: { select: { title: true } },
  request: { select: { title: true } },
  customer: person,
  provider: { select: { user: person } },
  messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true, createdAt: true } },
} satisfies Prisma.BookingSelect

export type ConversationRow = Prisma.BookingGetPayload<{ select: typeof conversationSelect }>

/** Who's who on a booking — the participant check for chat and for the booking's Pusher channel. */
const participantsSelect = { id: true, number: true, status: true, customerId: true, providerId: true, contactUnlockedAt: true } satisfies Prisma.BookingSelect

/**
 * Booking chat (CU-06, PR-09; docs/messages-feature.md). Dumb queries; who may read / write is decided in
 * `chat.service.ts`. Every read is scoped by the participant id the caller takes from the session.
 */
class ChatRepository {
  /** Bookings on my side whose chat is open or was open (the provider accepted). */
  findConversations(where: Prisma.BookingWhereInput) {
    return db.booking.findMany({ where: { ...where, contactUnlockedAt: { not: null } }, select: conversationSelect, take: 100, orderBy: { contactUnlockedAt: "desc" } })
  }

  findConversation(bookingId: string, where: Prisma.BookingWhereInput) {
    return db.booking.findFirst({ where: { ...where, id: bookingId }, select: conversationSelect })
  }

  findParticipants(bookingId: string) {
    return db.booking.findUnique({ where: { id: bookingId }, select: participantsSelect })
  }

  /** The newest `take` messages, returned oldest first. */
  async findMessages(bookingId: string, take: number) {
    const rows = await db.message.findMany({ where: { bookingId }, orderBy: { createdAt: "desc" }, take, select: { id: true, bookingId: true, senderId: true, body: true, createdAt: true } })
    return rows.reverse()
  }

  /**
   * Unread messages per booking for one side: messages from the other person after my read marker (or ever, if I never
   * opened the chat), on bookings whose chat is open to read. Raw SQL because it compares two columns.
   */
  async countUnread(userId: string, side: "CUSTOMER" | "PROVIDER") {
    const mine = side === "CUSTOMER" ? Prisma.sql`b."customerId"` : Prisma.sql`b."providerId"`
    const marker = side === "CUSTOMER" ? Prisma.sql`b."customerLastReadAt"` : Prisma.sql`b."providerLastReadAt"`
    const rows = await db.$queryRaw<{ bookingId: string; n: number }[]>`
      SELECT m."bookingId" AS "bookingId", COUNT(*)::int AS n
      FROM "Message" m
      JOIN "Booking" b ON b."id" = m."bookingId"
      WHERE ${mine} = ${userId}
        AND m."senderId" <> ${userId}
        AND b."contactUnlockedAt" IS NOT NULL
        AND (${marker} IS NULL OR m."createdAt" > ${marker})
      GROUP BY m."bookingId"`
    return rows
  }

  /** Move my read marker to `at` (never backwards). Scoped to my side of the booking. */
  async markRead(bookingId: string, userId: string, side: "CUSTOMER" | "PROVIDER", at: Date) {
    const where: Prisma.BookingWhereInput =
      side === "CUSTOMER"
        ? { id: bookingId, customerId: userId, OR: [{ customerLastReadAt: null }, { customerLastReadAt: { lt: at } }] }
        : { id: bookingId, providerId: userId, OR: [{ providerLastReadAt: null }, { providerLastReadAt: { lt: at } }] }
    const { count } = await db.booking.updateMany({ where, data: side === "CUSTOMER" ? { customerLastReadAt: at } : { providerLastReadAt: at } })
    return count
  }

  createMessage(data: Prisma.MessageUncheckedCreateInput) {
    return db.message.create({ data, select: { id: true, bookingId: true, senderId: true, body: true, createdAt: true } })
  }
}

export const chatRepository = new ChatRepository()
