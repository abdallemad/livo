import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const place = { select: { nameEn: true, nameAr: true } } as const

const detailSelect = (customerId: string) =>
  ({
    id: true,
    title: true,
    description: true,
    status: true,
    budget: true,
    preferredDate: true,
    expiresAt: true,
    createdAt: true,
    category: { select: { id: true, parentId: true, nameEn: true, nameAr: true, parent: place } },
    area: place,
    city: place,
    address: { select: { label: true, street: true, details: true, area: place, city: place } },
    media: { orderBy: { createdAt: "asc" }, select: { id: true, mimeType: true, sizeBytes: true } },
    _count: { select: { quotes: true, media: true } },
    quotes: {
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        price: true,
        durationDays: true,
        message: true,
        status: true,
        validUntil: true,
        createdAt: true,
        providerId: true,
        provider: {
          select: {
            userId: true,
            verificationStatus: true,
            ratingAvg: true,
            ratingCount: true,
            completedCount: true,
            yearsExperience: true,
            user: { select: { name: true, avatarUrl: true, status: true } },
          },
        },
      },
    },
    bookings: {
      orderBy: { createdAt: "desc" },
      take: 1,
      select: {
        id: true,
        number: true,
        status: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        payments: { select: { method: true, status: true, paidAt: true } },
        reviews: { where: { reviewerId: customerId }, select: { createdAt: true } },
      },
    },
  }) satisfies Prisma.ServiceRequestSelect

export type CustomerRequestDetailRow = Prisma.ServiceRequestGetPayload<{ select: ReturnType<typeof detailSelect> }>

/**
 * One of the signed-in customer's quote requests with its quotes, and the writes behind accepting one (CU-04, CU-05;
 * docs/customer-request-detail-feature.md). Every query is scoped by `customerId` from the session. Dumb queries;
 * rules live in `utils/customer-request.ts` and `customer-request.service.ts`.
 */
class CustomerRequestRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findDetail(id: string, customerId: string, client: Client = db) {
    return client.serviceRequest.findFirst({ where: { id, customerId }, select: detailSelect(customerId) })
  }

  findCustomerEmail(customerId: string) {
    return db.user.findUnique({ where: { id: customerId }, select: { email: true } })
  }

  /** Conditional `OPEN → ACCEPTED`, scoped to the owner. Returns the row count. */
  async acceptRequest(id: string, customerId: string, client: Client) {
    const { count } = await client.serviceRequest.updateMany({ where: { id, customerId, status: "OPEN" }, data: { status: "ACCEPTED" } })
    return count
  }

  /** Conditional `PENDING → ACCEPTED` for the chosen quote. Returns the row count. */
  async acceptQuote(quoteId: string, requestId: string, client: Client) {
    const { count } = await client.quote.updateMany({ where: { id: quoteId, requestId, status: "PENDING" }, data: { status: "ACCEPTED" } })
    return count
  }

  /** Every other waiting quote on the request → REJECTED ("not chosen"). */
  rejectOtherQuotes(requestId: string, keepQuoteId: string, client: Client) {
    return client.quote.updateMany({ where: { requestId, id: { not: keepQuoteId }, status: "PENDING" }, data: { status: "REJECTED" } })
  }

  createBooking(data: Prisma.BookingUncheckedCreateInput, client: Client) {
    return client.booking.create({ data, select: { id: true, number: true, status: true } })
  }

  createPayment(data: Prisma.PaymentUncheckedCreateInput, client: Client) {
    return client.payment.create({ data, select: { id: true } })
  }

  createNotifications(data: Prisma.NotificationCreateManyInput[], client: Client) {
    return client.notification.createMany({ data })
  }

  /** A cancelled quote booking closes its request too (the other quotes were already declined). */
  async cancelAcceptedRequest(requestId: string, customerId: string, client: Client) {
    const { count } = await client.serviceRequest.updateMany({ where: { id: requestId, customerId, status: "ACCEPTED" }, data: { status: "CANCELLED" } })
    return count
  }
}

export const customerRequestRepository = new CustomerRequestRepository()
