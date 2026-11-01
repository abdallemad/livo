import "server-only"
import type { BookingStatus, Prisma, RequestStatus } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { customerRepository as repo, type CustomerBookingRow, type CustomerRequestRow } from "@/repositories/customer.repository"
import type { CustomerRequestListQuery } from "@/schemas/customer.schema"
import type { AttentionItem, CustomerBookingCard, CustomerDashboardDto, CustomerRequestCard, CustomerRequestList } from "@/types/customer"
import { CUSTOMER_REQUEST_TABS, customerRequestState, lowestPrice, requestCancelBlockedReason } from "@/utils/customer-request"
import { formatPrice } from "@/utils/format"
import { firstName } from "@/utils/provider-booking"
import { formatZonedDateTime, zonedDayRange, zonedDaysBetween } from "@/utils/zoned-time"

/**
 * The customer's home (CU-08) and quote requests (CU-11, CU-13) — docs/customer-dashboard-requests-feature.md.
 * The customer id always comes from the session; another customer's request is a 404.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr
const REVIEW_WINDOW_DAYS = 30

function toRequestCard(r: CustomerRequestRow, now = new Date()): CustomerRequestCard {
  const pending = r.quotes.map((q) => num(q.price))
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: label(r.category),
    parentCategory: r.category.parent ? label(r.category.parent) : null,
    area: r.area ? label(r.area) : null,
    status: r.status,
    state: customerRequestState(r.status, pending.length),
    budget: r.budget ? num(r.budget) : null,
    preferredDate: r.preferredDate?.toISOString() ?? null,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    expiresInDays: r.expiresAt ? zonedDaysBetween(now, r.expiresAt) : null,
    createdAt: r.createdAt.toISOString(),
    photoCount: r._count.media,
    quoteCount: r._count.quotes,
    pendingQuotes: pending.length,
    lowestPendingPrice: lowestPrice(pending),
    booking: r.bookings[0] ?? null,
    cancelBlockedReason: requestCancelBlockedReason(r.status),
  }
}

const toBookingCard = (b: CustomerBookingRow): CustomerBookingCard => ({
  id: b.id,
  number: b.number,
  title: b.service?.title ?? b.request?.title ?? "Booking",
  status: b.status,
  scheduledAt: b.scheduledAt?.toISOString() ?? null,
  providerName: b.provider.user.name || "Your provider",
  amount: num(b.amount),
  autoReleaseAt: b.autoReleaseAt?.toISOString() ?? null,
})

export async function listMyRequests(customerId: string, query: CustomerRequestListQuery): Promise<CustomerRequestList> {
  const where: Prisma.ServiceRequestWhereInput = {
    customerId,
    status: { in: [...CUSTOMER_REQUEST_TABS[query.tab]] as RequestStatus[] },
    ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
  }
  const [[rows, total], grouped] = await Promise.all([
    repo.findRequestPage(where, (query.page - 1) * query.perPage, query.perPage),
    repo.countRequestsByStatus(customerId),
  ])
  const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]))
  const sum = (list: readonly RequestStatus[]) => list.reduce((s, st) => s + (byStatus.get(st) ?? 0), 0)
  return {
    items: rows.map((r) => toRequestCard(r)),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts: { active: sum(CUSTOMER_REQUEST_TABS.active), booked: sum(CUSTOMER_REQUEST_TABS.booked), closed: sum(CUSTOMER_REQUEST_TABS.closed) },
  }
}

/**
 * CU-11: the customer withdraws their own draft / open request. Waiting quotes expire and each provider
 * who quoted is told. Same rule and writes as the admin's "Close request", with the customer as actor.
 */
export async function cancelMyRequest(customerId: string, id: string): Promise<{ id: string; status: "CANCELLED" }> {
  return repo.transaction(async (tx) => {
    const request = await repo.findRequestForCancel(id, customerId, tx)
    if (!request) throw new NotFoundError("That request doesn't exist.")
    const blocked = requestCancelBlockedReason(request.status)
    if (blocked) throw new ConflictError(blocked)
    if ((await repo.cancelRequest(id, customerId, ["DRAFT", "OPEN"], tx)) === 0) {
      throw new ConflictError("This request just changed — a quote may have been accepted. Reload to see the latest.")
    }
    await repo.expirePendingQuotes(id, tx)
    await auditRepository.createAuditLog(
      { actorId: customerId, action: "request.cancel_by_customer", entityType: "ServiceRequest", entityId: id, metadata: { from: request.status } },
      tx,
    )
    for (const providerId of new Set(request.quotes.map((q) => q.providerId))) {
      await auditRepository.createNotification(
        { userId: providerId, type: "SYSTEM", title: `The customer cancelled "${request.title}"`, body: "Your quote on it is no longer active.", payload: { requestId: id } },
        tx,
      )
    }
    return { id, status: "CANCELLED" }
  })
}

const UPCOMING: BookingStatus[] = ["PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS"]
const PREVIEW = 5

export async function getCustomerDashboard(customerId: string, now = new Date()): Promise<CustomerDashboardDto> {
  const reviewSince = new Date(zonedDayRange(now).start.getTime() - REVIEW_WINDOW_DAYS * 86_400_000)
  const reviewable: Prisma.BookingWhereInput = { completedAt: { gte: reviewSince }, reviews: { none: { reviewerId: customerId } } }
  const [user, upcoming, upcomingCount, toConfirm, toPay, toReview, toReviewCount, openRows, openCount, quotesWaiting] = await Promise.all([
    repo.findName(customerId),
    repo.findBookings({ customerId, status: { in: UPCOMING } }, [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }], PREVIEW),
    repo.countBookings(customerId, UPCOMING),
    repo.findBookings({ customerId, status: "AWAITING_CONFIRMATION" }, [{ autoReleaseAt: { sort: "asc", nulls: "last" } }], PREVIEW),
    repo.findBookings({ customerId, status: "PENDING_PAYMENT" }, [{ createdAt: "desc" }], PREVIEW),
    repo.findBookings({ customerId, status: { in: ["COMPLETED", "CLOSED"] }, ...reviewable }, [{ completedAt: "desc" }], PREVIEW),
    repo.countBookings(customerId, ["COMPLETED", "CLOSED"], reviewable),
    repo.findRequestPage({ customerId, status: "OPEN" }, 0, PREVIEW).then(([rows]) => rows),
    repo.countRequestsByStatus(customerId).then((g) => g.find((x) => x.status === "OPEN")?._count._all ?? 0),
    repo.countPendingQuotes(customerId),
  ])

  const openRequests = openRows.map((r) => toRequestCard(r, now))
  const attention: AttentionItem[] = [
    ...toConfirm.map(toBookingCard).map((b) => ({
      kind: "CONFIRM_DONE" as const,
      id: b.id,
      title: b.title,
      href: `/account/bookings/${b.id}`,
      detail: b.autoReleaseAt
        ? `${b.providerName} marked the job done. Confirm it, or report a problem before ${formatZonedDateTime(b.autoReleaseAt)}.`
        : `${b.providerName} marked the job done. Confirm it or report a problem.`,
      at: b.autoReleaseAt,
    })),
    ...toPay.map(toBookingCard).map((b) => ({
      kind: "PAY" as const,
      id: b.id,
      title: b.title,
      href: `/account/bookings/${b.id}`,
      detail: `Finish paying ${formatPrice(b.amount)} so ${b.providerName} gets your booking.`,
      at: null,
    })),
    ...openRequests
      .filter((r) => r.pendingQuotes > 0)
      .map((r) => ({
        kind: "COMPARE_QUOTES" as const,
        id: r.id,
        title: r.title,
        href: `/account/requests/${r.id}`,
        detail: `${r.pendingQuotes} ${r.pendingQuotes === 1 ? "quote is" : "quotes are"} waiting${r.lowestPendingPrice !== null ? `, from ${formatPrice(r.lowestPendingPrice)}` : ""}. Compare and choose one.`,
        at: r.expiresAt,
      })),
    ...toReview.map(toBookingCard).map((b) => ({
      kind: "REVIEW" as const,
      id: b.id,
      title: b.title,
      href: `/account/bookings/${b.id}/review`,
      detail: `How did ${b.providerName} do? Your review helps other customers.`,
      at: null,
    })),
  ]

  return {
    name: firstName(user?.name),
    stats: { upcomingBookings: upcomingCount, openRequests: openCount, quotesWaiting, toReview: toReviewCount },
    attention,
    upcoming: upcoming.map(toBookingCard),
    openRequests,
  }
}
