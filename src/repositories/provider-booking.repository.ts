import "server-only"
import type { BookingStatus, EscrowState, PaymentStatus, Prisma, PrismaClient, QuoteStatus } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const place = { select: { nameEn: true, nameAr: true } } as const

const quoteSelect = {
  id: true,
  price: true,
  durationDays: true,
  message: true,
  status: true,
  validUntil: true,
  createdAt: true,
  request: {
    select: {
      id: true,
      title: true,
      status: true,
      budget: true,
      category: place,
      area: place,
      city: place,
      _count: { select: { quotes: true } },
    },
  },
  booking: { select: { id: true, number: true, status: true } },
} satisfies Prisma.QuoteSelect

const bookingListSelect = {
  id: true,
  number: true,
  source: true,
  status: true,
  scheduledAt: true,
  createdAt: true,
  addressSnapshot: true,
  contactUnlockedAt: true,
  autoReleaseAt: true,
  amount: true,
  providerNet: true,
  customer: { select: { name: true } },
  service: { select: { title: true } },
  request: { select: { title: true } },
  payments: { orderBy: { createdAt: "asc" }, select: { id: true, method: true, amount: true, refundedAmount: true, status: true, escrowState: true } },
} satisfies Prisma.BookingSelect

const bookingDetailSelect = {
  ...bookingListSelect,
  customerId: true,
  serviceId: true,
  requestId: true,
  notes: true,
  commissionRate: true,
  commissionAmount: true,
  startedAt: true,
  providerCompletedAt: true,
  completedAt: true,
  cancelledAt: true,
  cancelledById: true,
  cancelReason: true,
  customer: { select: { name: true, phone: true } },
  quote: { select: { price: true, durationDays: true } },
  dispute: { select: { status: true, reason: true } },
} satisfies Prisma.BookingSelect

export type ProviderQuoteRow = Prisma.QuoteGetPayload<{ select: typeof quoteSelect }>
export type ProviderBookingRow = Prisma.BookingGetPayload<{ select: typeof bookingListSelect }>
export type ProviderBookingDetailRow = Prisma.BookingGetPayload<{ select: typeof bookingDetailSelect }>

/**
 * The provider's own quotes and bookings (PR-07, PR-08). Every read and write is scoped by
 * `providerId`, which the caller takes from the session — a foreign id simply finds nothing.
 * Dumb queries; rules live in `utils/provider-booking.ts` / `utils/provider-quote.ts` and the services.
 */
class ProviderBookingRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  // --- quotes ---------------------------------------------------------------

  findQuotePage(where: Prisma.QuoteWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.quote.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip, take, select: quoteSelect }),
      db.quote.count({ where }),
    ])
  }

  countQuotesByStatus(providerId: string) {
    return db.quote.groupBy({ by: ["status"], where: { providerId }, _count: { _all: true } })
  }

  findQuoteForUpdate(id: string, providerId: string, client: Client) {
    return client.quote.findFirst({ where: { id, providerId }, select: { id: true, status: true, request: { select: { id: true, status: true } } } })
  }

  /** Conditional `PENDING → status` on a still-OPEN request. Returns the row count. */
  async closeQuote(id: string, providerId: string, status: QuoteStatus, client: Client) {
    const { count } = await client.quote.updateMany({ where: { id, providerId, status: "PENDING", request: { status: "OPEN" } }, data: { status } })
    return count
  }

  // --- bookings -------------------------------------------------------------

  findBookingPage(where: Prisma.BookingWhereInput, orderBy: Prisma.BookingOrderByWithRelationInput[], skip: number, take: number) {
    return db.$transaction([
      db.booking.findMany({ where, orderBy, skip, take, select: bookingListSelect }),
      db.booking.count({ where }),
    ])
  }

  countBookingsByStatus(providerId: string) {
    return db.booking.groupBy({ by: ["status"], where: { providerId }, _count: { _all: true } })
  }

  findBookingDetail(id: string, providerId: string) {
    return db.booking.findFirst({ where: { id, providerId }, select: bookingDetailSelect })
  }

  findBookingForUpdate(id: string, providerId: string, client: Client) {
    return client.booking.findFirst({
      where: { id, providerId },
      select: {
        id: true,
        number: true,
        status: true,
        customerId: true,
        payments: { select: { id: true, method: true, amount: true, refundedAmount: true, status: true, escrowState: true } },
      },
    })
  }

  findVerificationStatus(providerId: string, client: Client = db) {
    return client.providerProfile.findUnique({ where: { userId: providerId }, select: { verificationStatus: true } })
  }

  async findSetting(key: string, client: Client = db) {
    return (await client.siteSetting.findUnique({ where: { key }, select: { value: true } }))?.value ?? null
  }

  /** Conditional `from → to` in one UPDATE, scoped to the provider (race-safe). Returns the row count. */
  async transition(id: string, providerId: string, from: BookingStatus, data: Prisma.BookingUncheckedUpdateManyInput, client: Client) {
    const { count } = await client.booking.updateMany({ where: { id, providerId, status: from }, data })
    return count
  }

  updatePayment(id: string, data: { status: PaymentStatus; escrowState: EscrowState; refundedAmount: number }, client: Client) {
    return client.payment.update({ where: { id }, data })
  }
}

export const providerBookingRepository = new ProviderBookingRepository()
