import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const bookingSelect = {
  id: true,
  number: true,
  status: true,
  providerId: true,
  completedAt: true,
  service: { select: { title: true } },
  request: { select: { title: true } },
  provider: { select: { user: { select: { name: true, avatarUrl: true } } } },
} satisfies Prisma.BookingSelect

const reviewSelect = { id: true, rating: true, comment: true, providerReply: true, isHidden: true, createdAt: true, updatedAt: true } satisfies Prisma.ReviewSelect

export type CustomerReviewBookingRow = Prisma.BookingGetPayload<{ select: typeof bookingSelect }>
export type CustomerReviewRow = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>

/**
 * The customer's own review of one of their bookings (CU-10; docs/customer-review-feature.md). Every query is scoped by
 * the customer id from the session: someone else's booking or review finds nothing. Dumb queries; the rules live in
 * `utils/customer-review.ts` and `customer-review.service.ts`.
 */
class CustomerReviewRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findBooking(id: string, customerId: string, client: Client = db) {
    return client.booking.findFirst({ where: { id, customerId }, select: bookingSelect })
  }

  findReview(bookingId: string, reviewerId: string, client: Client = db) {
    return client.review.findUnique({ where: { bookingId_reviewerId: { bookingId, reviewerId } }, select: reviewSelect })
  }

  create(data: Prisma.ReviewUncheckedCreateInput, client: Client) {
    return client.review.create({ data, select: reviewSelect })
  }

  /**
   * Edits the review only while it's still editable — the reviewer's, visible, not replied to, created after `since` —
   * in one conditional UPDATE, so a reply or a moderation landing at the same moment wins. Returns the row count.
   */
  async updateEditable(id: string, reviewerId: string, since: Date, data: { rating: number; comment: string | null }, client: Client) {
    const { count } = await client.review.updateMany({
      where: { id, reviewerId, isHidden: false, providerReply: null, createdAt: { gte: since } },
      data,
    })
    return count
  }
}

export const customerReviewRepository = new CustomerReviewRepository()
