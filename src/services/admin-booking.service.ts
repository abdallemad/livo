import "server-only"
import type { BookingStatus, Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { bookingRepository as repo, type AdminBookingRow } from "@/repositories/booking.repository"
import type { AdminCancelValues, BookingListQuery } from "@/schemas/admin.schema"
import { getEntityHistory } from "@/services/audit.service"
import type { AdminBookingDetail, AdminBookingList, AdminBookingListItem } from "@/types/admin"
import {
  ADMIN_CANCELLABLE_BOOKING,
  adminCancelBlockedReason,
  bookingEvents,
  formatAddressSnapshot,
} from "@/utils/booking-admin"

/**
 * Bookings for admins (AD-04, docs/admin-requests-bookings-feature.md): the
 * list with status counts, the full booking (money snapshot, payments /
 * escrow, milestones, chat for disputes, reviews) and cancelling a booking
 * before any money is captured. Refunds are NOT done here — they belong to
 * the dispute flow (AD-05). Callers must already have passed `requireAdmin()`
 * or the admin layout gate.
 */

const num = (value: { toString(): string }) => Number(value.toString())

const toListItem = (b: AdminBookingRow): AdminBookingListItem => ({
  id: b.id,
  number: b.number,
  source: b.source,
  title: b.service?.title ?? b.request?.title ?? "—",
  customerId: b.customerId,
  customerName: b.customer.name || "Unnamed customer",
  providerId: b.providerId,
  providerName: b.provider.user.name || "Unnamed provider",
  amount: num(b.amount),
  commissionAmount: num(b.commissionAmount),
  status: b.status,
  paymentMethod: b.payments[0]?.method ?? null,
  escrowState: b.payments[0]?.escrowState ?? null,
  scheduledAt: b.scheduledAt?.toISOString() ?? null,
  createdAt: b.createdAt.toISOString(),
})

export async function listBookingsForAdmin(query: BookingListQuery): Promise<AdminBookingList> {
  const where: Prisma.BookingWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.q
      ? {
          OR: [
            { number: { contains: query.q, mode: "insensitive" } },
            { customer: { name: { contains: query.q, mode: "insensitive" } } },
            { provider: { user: { name: { contains: query.q, mode: "insensitive" } } } },
            { service: { title: { contains: query.q, mode: "insensitive" } } },
            { request: { title: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  }
  const [[rows, total], grouped] = await Promise.all([
    repo.findAdminPage(where, (query.page - 1) * query.perPage, query.perPage),
    repo.countByStatus(),
  ])
  const counts = Object.fromEntries(
    (
      [
        "PENDING_PAYMENT",
        "PENDING_PROVIDER",
        "CONFIRMED",
        "IN_PROGRESS",
        "AWAITING_CONFIRMATION",
        "COMPLETED",
        "CLOSED",
        "CANCELLED",
        "REJECTED",
        "DISPUTED",
      ] as BookingStatus[]
    ).map((s) => [s, 0]),
  ) as Record<BookingStatus, number>
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

export async function getBookingForAdmin(id: string): Promise<AdminBookingDetail | null> {
  const [b, history] = await Promise.all([repo.findAdminDetail(id), getEntityHistory("Booking", id)])
  if (!b) return null
  const cancelledBy = b.cancelledById ? ((await repo.findUserName(b.cancelledById))?.name ?? "Unknown user") : null
  const cancelBlockedReason = adminCancelBlockedReason(b.status, b.payments)

  return {
    ...toListItem(b),
    commissionRate: num(b.commissionRate),
    providerNet: num(b.providerNet),
    notes: b.notes,
    address: formatAddressSnapshot(b.addressSnapshot),
    serviceId: b.serviceId,
    requestId: b.requestId,
    contactUnlocked: b.contactUnlockedAt !== null,
    cancelReason: b.cancelReason,
    cancelledBy,
    canCancel: cancelBlockedReason === null,
    cancelBlockedReason,
    events: bookingEvents(b).map((e) => ({ ...e, at: e.at.toISOString() })),
    payments: b.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: num(p.amount),
      status: p.status,
      escrowState: p.escrowState,
      refundedAmount: num(p.refundedAmount),
      milestone: p.milestone?.title ?? null,
      gatewayRef: p.gatewayRef,
      paidAt: p.paidAt?.toISOString() ?? null,
      releasedAt: p.releasedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    milestones: b.milestones.map((m) => ({ id: m.id, title: m.title, amount: num(m.amount), status: m.status, dueAt: m.dueAt?.toISOString() ?? null })),
    messages: b.messages.map((m) => ({
      id: m.id,
      senderSide: m.senderId === b.customerId ? "CUSTOMER" : m.senderId === b.providerId ? "PROVIDER" : "OTHER",
      senderName: m.sender.name || "Unknown user",
      body: m.body,
      contactBlocked: m.contactBlocked,
      createdAt: m.createdAt.toISOString(),
    })),
    reviews: b.reviews.map((r) => ({
      id: r.id,
      byProvider: r.reviewerId === b.providerId,
      rating: r.rating,
      comment: r.comment,
      isHidden: r.isHidden,
      createdAt: r.createdAt.toISOString(),
    })),
    dispute: b.dispute,
    history,
  }
}

/**
 * Cancel a booking that hasn't started and has no captured money (rule in
 * `utils/booking-admin.ts`). Pending payments are marked FAILED so the
 * checkout can't complete afterwards; both sides are notified with the reason.
 */
export async function cancelBooking(adminId: string, id: string, input: AdminCancelValues): Promise<{ id: string; status: BookingStatus }> {
  return repo.transaction(async (tx) => {
    const booking = await repo.findForCancel(id, tx)
    if (!booking) throw new NotFoundError("That booking no longer exists.")
    const blocked = adminCancelBlockedReason(booking.status, booking.payments)
    if (blocked) throw new ConflictError(blocked)
    if ((await repo.cancel(id, ADMIN_CANCELLABLE_BOOKING, { by: adminId, reason: input.reason, at: new Date() }, tx)) === 0) {
      throw new ConflictError("This booking's status just changed. Reload to see the latest.")
    }
    await repo.failPendingPayments(id, tx)

    await auditRepository.createAuditLog(
      { actorId: adminId, action: "booking.cancel", entityType: "Booking", entityId: id, metadata: { from: booking.status, reason: input.reason } },
      tx,
    )
    for (const userId of [booking.customerId, booking.providerId]) {
      await auditRepository.createNotification(
        {
          userId,
          type: "BOOKING_STATUS_CHANGED",
          title: `Booking ${booking.number} was cancelled by our team`,
          body: input.reason,
          payload: { bookingId: id },
        },
        tx,
      )
    }
    return { id, status: "CANCELLED" }
  })
}
