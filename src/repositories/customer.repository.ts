import "server-only"
import type { BookingStatus, Prisma, PrismaClient, RequestStatus } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const place = { select: { nameEn: true, nameAr: true } } as const

const requestCardSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  budget: true,
  preferredDate: true,
  expiresAt: true,
  createdAt: true,
  category: { select: { nameEn: true, nameAr: true, parent: place } },
  area: place,
  _count: { select: { quotes: true, media: true } },
  quotes: { where: { status: "PENDING" }, select: { price: true } },
  bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, number: true, status: true } },
} satisfies Prisma.ServiceRequestSelect

export type CustomerRequestRow = Prisma.ServiceRequestGetPayload<{ select: typeof requestCardSelect }>

const bookingCardSelect = {
  id: true,
  number: true,
  status: true,
  scheduledAt: true,
  amount: true,
  autoReleaseAt: true,
  completedAt: true,
  service: { select: { title: true } },
  request: { select: { title: true } },
  provider: { select: { user: { select: { name: true } } } },
} satisfies Prisma.BookingSelect

export type CustomerBookingRow = Prisma.BookingGetPayload<{ select: typeof bookingCardSelect }>

/**
 * The signed-in customer's own requests and bookings (CU-08, CU-13). Every query is scoped by
 * `customerId` from the session — another customer's id simply finds nothing. Dumb queries.
 */
class CustomerRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findName(customerId: string) {
    return db.user.findUnique({ where: { id: customerId }, select: { name: true } })
  }

  // --- requests -------------------------------------------------------------

  findRequestPage(where: Prisma.ServiceRequestWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.serviceRequest.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip, take, select: requestCardSelect }),
      db.serviceRequest.count({ where }),
    ])
  }

  countRequestsByStatus(customerId: string) {
    return db.serviceRequest.groupBy({ by: ["status"], where: { customerId }, _count: { _all: true } })
  }

  findRequestForCancel(id: string, customerId: string, client: Client) {
    return client.serviceRequest.findFirst({
      where: { id, customerId },
      select: { id: true, title: true, status: true, quotes: { where: { status: "PENDING" }, select: { providerId: true } } },
    })
  }

  /** Conditional `status IN from → CANCELLED`, scoped to the owner. Returns the row count. */
  async cancelRequest(id: string, customerId: string, from: RequestStatus[], client: Client) {
    const { count } = await client.serviceRequest.updateMany({ where: { id, customerId, status: { in: from } }, data: { status: "CANCELLED" } })
    return count
  }

  expirePendingQuotes(requestId: string, client: Client) {
    return client.quote.updateMany({ where: { requestId, status: "PENDING" }, data: { status: "EXPIRED" } })
  }

  /** Quotes waiting for this customer's decision (on their still-open requests). */
  countPendingQuotes(customerId: string) {
    return db.quote.count({ where: { status: "PENDING", request: { customerId, status: "OPEN" } } })
  }

  // --- bookings -------------------------------------------------------------

  findBookings(where: Prisma.BookingWhereInput, orderBy: Prisma.BookingOrderByWithRelationInput[], take: number) {
    return db.booking.findMany({ where, orderBy, take, select: bookingCardSelect })
  }

  countBookings(customerId: string, statuses: BookingStatus[], extra: Prisma.BookingWhereInput = {}) {
    return db.booking.count({ where: { customerId, status: { in: statuses }, ...extra } })
  }
}

export const customerRepository = new CustomerRepository()
