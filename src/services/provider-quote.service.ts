import "server-only"
import type { Prisma, QuoteStatus } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { providerBookingRepository as repo, type ProviderQuoteRow } from "@/repositories/provider-booking.repository"
import type { ProviderQuoteListQuery } from "@/schemas/provider.schema"
import type { ProviderQuoteList, ProviderQuoteListItem } from "@/types/provider"
import { quoteWithdrawBlockedReason } from "@/utils/provider-quote"

/**
 * The provider's quotes (PR-07, docs/provider-quotes-bookings-feature.md): every quote with its
 * request and, once accepted, its booking; withdrawing a waiting quote. The provider id always comes
 * from the session. Other providers' prices are never returned — only how many quotes a request has.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr
const STATUSES: QuoteStatus[] = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"]

const toItem = (q: ProviderQuoteRow): ProviderQuoteListItem => ({
  id: q.id,
  price: num(q.price),
  durationDays: q.durationDays,
  message: q.message,
  status: q.status,
  validUntil: q.validUntil?.toISOString() ?? null,
  createdAt: q.createdAt.toISOString(),
  request: {
    id: q.request.id,
    title: q.request.title,
    category: label(q.request.category),
    area: q.request.area ? label(q.request.area) : null,
    city: label(q.request.city),
    status: q.request.status,
    budget: q.request.budget ? num(q.request.budget) : null,
    quoteCount: q.request._count.quotes,
  },
  booking: q.booking,
  withdrawBlockedReason: quoteWithdrawBlockedReason(q.status, q.request.status),
})

export async function listQuotesForProvider(providerId: string, query: ProviderQuoteListQuery): Promise<ProviderQuoteList> {
  const where: Prisma.QuoteWhereInput = {
    providerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? { request: { title: { contains: query.q, mode: "insensitive" } } } : {}),
  }
  const [[rows, total], grouped] = await Promise.all([
    repo.findQuotePage(where, (query.page - 1) * query.perPage, query.perPage),
    repo.countQuotesByStatus(providerId),
  ])
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<QuoteStatus, number>
  for (const g of grouped) counts[g.status] = g._count._all
  return {
    items: rows.map(toItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts,
  }
}

/** PENDING → WITHDRAWN while the request is OPEN. Conditional update, so a quote accepted a moment ago can't be withdrawn. */
export async function withdrawQuote(providerId: string, id: string): Promise<{ id: string; status: QuoteStatus }> {
  return repo.transaction(async (tx) => {
    const quote = await repo.findQuoteForUpdate(id, providerId, tx)
    if (!quote) throw new NotFoundError("That quote no longer exists.")
    const blocked = quoteWithdrawBlockedReason(quote.status, quote.request.status)
    if (blocked) throw new ConflictError(blocked)
    if ((await repo.closeQuote(id, providerId, "WITHDRAWN", tx)) === 0) {
      throw new ConflictError("This quote just changed. Reload to see the latest.")
    }
    return { id, status: "WITHDRAWN" }
  })
}
