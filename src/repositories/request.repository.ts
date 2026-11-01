import "server-only"
import type { Prisma, PrismaClient, RequestStatus } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const place = { select: { nameEn: true, nameAr: true } } as const

const adminListSelect = {
  id: true,
  title: true,
  customerId: true,
  budget: true,
  status: true,
  preferredDate: true,
  expiresAt: true,
  createdAt: true,
  customer: { select: { name: true } },
  category: { select: { nameEn: true, nameAr: true, parent: place } },
  area: place,
  city: place,
  _count: { select: { quotes: true } },
  quotes: { where: { status: "PENDING" }, select: { id: true } },
} satisfies Prisma.ServiceRequestSelect

const adminDetailSelect = {
  ...adminListSelect,
  description: true,
  address: { select: { street: true, details: true } },
  _count: { select: { quotes: true, media: true } },
  quotes: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      providerId: true,
      price: true,
      durationDays: true,
      message: true,
      status: true,
      validUntil: true,
      createdAt: true,
      provider: { select: { user: { select: { name: true } } } },
      booking: { select: { id: true } },
    },
  },
  bookings: { select: { id: true, number: true, status: true } },
} satisfies Prisma.ServiceRequestSelect

/**
 * What a PROVIDER may read about a request (PR-06): no customer, no address (BR-02, SY-04).
 * `quotes` is filtered to the reading provider's own quote by the caller (`myQuoteSelect`).
 */
const providerCardSelect = (providerId: string) =>
  ({
    id: true,
    title: true,
    description: true,
    budget: true,
    preferredDate: true,
    status: true,
    expiresAt: true,
    createdAt: true,
    areaId: true,
    category: { select: { nameEn: true, nameAr: true, parent: place } },
    area: place,
    city: place,
    _count: { select: { quotes: true, media: true } },
    quotes: {
      where: { providerId },
      take: 1,
      select: { id: true, price: true, durationDays: true, status: true, createdAt: true },
    },
  }) satisfies Prisma.ServiceRequestSelect

export type ProviderRequestRow = Prisma.ServiceRequestGetPayload<{ select: ReturnType<typeof providerCardSelect> }>

export type AdminRequestRow = Prisma.ServiceRequestGetPayload<{ select: typeof adminListSelect }>
export type AdminRequestDetailRow = Prisma.ServiceRequestGetPayload<{ select: typeof adminDetailSelect }>

/** Quote requests (Type B) and their quotes. Dumb queries; rules live in the services. */
class RequestRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** Paginated admin list: rows + total in one transaction. */
  findAdminPage(where: Prisma.ServiceRequestWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.serviceRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: adminListSelect }),
      db.serviceRequest.count({ where }),
    ])
  }

  countByStatus() {
    return db.serviceRequest.groupBy({ by: ["status"], _count: { _all: true } })
  }

  findAdminDetail(id: string) {
    return db.serviceRequest.findUnique({ where: { id }, select: adminDetailSelect })
  }

  findForCancel(id: string, client: Client = db) {
    return client.serviceRequest.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, customerId: true, quotes: { where: { status: "PENDING" }, select: { providerId: true } } },
    })
  }

  /** Conditional `status IN from → CANCELLED` in one UPDATE (race-safe). Returns the row count. */
  async cancel(id: string, from: RequestStatus[], client: Client) {
    const { count } = await client.serviceRequest.updateMany({
      where: { id, status: { in: from } },
      data: { status: "CANCELLED" },
    })
    return count
  }

  /** Pending quotes on a closed request can never be accepted any more. */
  /** Provider list (PR-06): rows + total in one transaction. `where` already encodes the matching rules. */
  findProviderPage(
    providerId: string,
    where: Prisma.ServiceRequestWhereInput,
    orderBy: Prisma.ServiceRequestOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return db.$transaction([
      db.serviceRequest.findMany({ where, orderBy, skip, take, select: providerCardSelect(providerId) }),
      db.serviceRequest.count({ where }),
    ])
  }

  count(where: Prisma.ServiceRequestWhereInput) {
    return db.serviceRequest.count({ where })
  }

  expirePendingQuotes(requestId: string, client: Client) {
    return client.quote.updateMany({ where: { requestId, status: "PENDING" }, data: { status: "EXPIRED" } })
  }
}

export const requestRepository = new RequestRepository()
