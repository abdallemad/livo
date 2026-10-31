import "server-only"
import type { Prisma, RequestStatus } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { requestRepository as repo, type AdminRequestRow } from "@/repositories/request.repository"
import type { AdminCancelValues, RequestListQuery } from "@/schemas/admin.schema"
import { getEntityHistory } from "@/services/audit.service"
import type { AdminRequestDetail, AdminRequestList, AdminRequestListItem } from "@/types/admin"

/**
 * Quote requests for admins (AD-04, docs/admin-requests-bookings-feature.md):
 * the list with status counts, one request with its quotes, and closing a
 * request that breaks the rules. Callers must already have passed
 * `requireAdmin()` or the admin layout gate.
 */

/** Only requests nobody has committed to yet can be closed by an admin; ACCEPTED ones have a booking. */
const CANCELLABLE: RequestStatus[] = ["DRAFT", "OPEN"]

const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr
const money = (value: { toString(): string } | null) => (value === null ? null : Number(value.toString()))

const toListItem = (r: AdminRequestRow): AdminRequestListItem => ({
  id: r.id,
  title: r.title,
  customerId: r.customerId,
  customerName: r.customer.name || "Unnamed customer",
  category: r.category.parent ? `${label(r.category.parent)} · ${label(r.category)}` : label(r.category),
  area: r.area ? label(r.area) : null,
  city: label(r.city),
  budget: money(r.budget),
  status: r.status,
  quoteCount: r._count.quotes,
  pendingQuoteCount: r.quotes.length,
  preferredDate: r.preferredDate?.toISOString() ?? null,
  expiresAt: r.expiresAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
})

export async function listRequestsForAdmin(query: RequestListQuery): Promise<AdminRequestList> {
  const where: Prisma.ServiceRequestWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.categoryId ? { OR: [{ categoryId: query.categoryId }, { category: { parentId: query.categoryId } }] } : {}),
    ...(query.q
      ? {
          AND: [
            {
              OR: [
                { title: { contains: query.q, mode: "insensitive" } },
                { customer: { name: { contains: query.q, mode: "insensitive" } } },
                { id: query.q },
              ],
            },
          ],
        }
      : {}),
  }
  const [[rows, total], grouped] = await Promise.all([
    repo.findAdminPage(where, (query.page - 1) * query.perPage, query.perPage),
    repo.countByStatus(),
  ])
  const counts: Record<RequestStatus, number> = { DRAFT: 0, OPEN: 0, ACCEPTED: 0, CANCELLED: 0, EXPIRED: 0 }
  for (const g of grouped) counts[g.status] = g._count._all

  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts,
  }
}

export async function getRequestForAdmin(id: string): Promise<AdminRequestDetail | null> {
  const [r, history] = await Promise.all([repo.findAdminDetail(id), getEntityHistory("ServiceRequest", id)])
  if (!r) return null
  return {
    ...toListItem({ ...r, quotes: r.quotes.filter((q) => q.status === "PENDING") }),
    description: r.description,
    mediaCount: r._count.media,
    address: r.address ? [r.address.street, r.address.details].filter(Boolean).join(", ") : null,
    quotes: r.quotes.map((q) => ({
      id: q.id,
      providerId: q.providerId,
      providerName: q.provider.user.name || "Unnamed provider",
      price: Number(q.price.toString()),
      durationDays: q.durationDays,
      message: q.message,
      status: q.status,
      validUntil: q.validUntil?.toISOString() ?? null,
      createdAt: q.createdAt.toISOString(),
      bookingId: q.booking?.id ?? null,
    })),
    bookings: r.bookings,
    history,
  }
}

/**
 * Close a DRAFT/OPEN request (spam, duplicate, against the rules). Pending
 * quotes expire, the customer and every quoting provider are told why, and
 * the change is audited — all in one transaction.
 */
export async function cancelRequest(adminId: string, id: string, input: AdminCancelValues): Promise<{ id: string; status: RequestStatus }> {
  return repo.transaction(async (tx) => {
    const request = await repo.findForCancel(id, tx)
    if (!request) throw new NotFoundError("That request no longer exists.")
    if ((await repo.cancel(id, CANCELLABLE, tx)) === 0) {
      throw new ConflictError(
        request.status === "ACCEPTED"
          ? "This request already has a booking. Cancel the booking instead."
          : "This request is already closed.",
      )
    }
    await repo.expirePendingQuotes(id, tx)

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: "request.cancel",
        entityType: "ServiceRequest",
        entityId: id,
        metadata: { from: request.status, reason: input.reason },
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: request.customerId,
        type: "SYSTEM",
        title: `Your request "${request.title}" was closed by our team`,
        body: input.reason,
        payload: { requestId: id },
      },
      tx,
    )
    for (const providerId of new Set(request.quotes.map((q) => q.providerId))) {
      await auditRepository.createNotification(
        {
          userId: providerId,
          type: "SYSTEM",
          title: `The request "${request.title}" was closed`,
          body: "Your quote on it is no longer active.",
          payload: { requestId: id },
        },
        tx,
      )
    }
    return { id, status: "CANCELLED" }
  })
}
