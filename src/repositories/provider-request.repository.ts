import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const place = { select: { nameEn: true, nameAr: true } } as const

/**
 * What a PROVIDER may read about one request (PR-06, PR-07): no customer name / phone / email and no street address
 * (BR-02, SY-04). `customerId` is selected only to refuse quoting your own request and to notify the customer — it is
 * never put in a DTO. `quotes` is the reading provider's own quote only.
 */
const detailSelect = (providerId: string) =>
  ({
    id: true,
    customerId: true,
    title: true,
    description: true,
    budget: true,
    preferredDate: true,
    status: true,
    expiresAt: true,
    createdAt: true,
    cityId: true,
    categoryId: true,
    areaId: true,
    category: { select: { nameEn: true, nameAr: true, parent: place } },
    area: place,
    city: place,
    media: { orderBy: { createdAt: "asc" }, select: { id: true } },
    _count: { select: { quotes: true, media: true } },
    quotes: {
      where: { providerId },
      take: 1,
      select: {
        id: true,
        price: true,
        durationDays: true,
        message: true,
        status: true,
        validUntil: true,
        createdAt: true,
        booking: { select: { id: true, number: true, status: true } },
      },
    },
  }) satisfies Prisma.ServiceRequestSelect

export type ProviderRequestDetailRow = Prisma.ServiceRequestGetPayload<{ select: ReturnType<typeof detailSelect> }>

/**
 * One request as a provider sees it, its photos, and the provider's quote on it (PR-07;
 * docs/provider-request-detail-feature.md). Dumb queries; who may see / quote is decided in `provider-request.service.ts`.
 */
class ProviderRequestRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findDetail(id: string, providerId: string, client: Client = db) {
    return client.serviceRequest.findUnique({ where: { id }, select: detailSelect(providerId) })
  }

  findRequestPhoto(requestId: string, fileId: string) {
    return db.file.findFirst({ where: { id: fileId, requestId }, select: { key: true, mimeType: true } })
  }

  createQuote(data: Prisma.QuoteUncheckedCreateInput, client: Client) {
    return client.quote.create({ data, select: { id: true, status: true } })
  }

  /** Conditional update of my quote while it's in one of `from` (race-safe). Returns the row count. */
  async updateQuote(id: string, providerId: string, from: Prisma.QuoteWhereInput["status"], data: Prisma.QuoteUncheckedUpdateManyInput, client: Client) {
    const { count } = await client.quote.updateMany({ where: { id, providerId, status: from, request: { status: "OPEN" } }, data })
    return count
  }

  createNotification(data: Prisma.NotificationUncheckedCreateInput, client: Client) {
    return client.notification.create({ data })
  }
}

export const providerRequestRepository = new ProviderRequestRepository()
