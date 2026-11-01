import "server-only"
import type { BookingStatus, Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import {
  providerBookingRepository as repo,
  type ProviderBookingDetailRow,
  type ProviderBookingRow,
} from "@/repositories/provider-booking.repository"
import type { ProviderBookingListQuery, ProviderBookingStatusValues } from "@/schemas/provider.schema"
import type { ProviderBookingDetail, ProviderBookingList, ProviderBookingListItem, ProviderBookingStatusDto } from "@/types/provider"
import { bookingEvents } from "@/utils/booking-admin"
import { maskContactDetails } from "@/utils/contact-mask"
import {
  ACTION_BY_TARGET,
  autoReleaseAt,
  bookingPlace,
  declinePaymentChanges,
  firstName,
  HIDDEN_FROM_PROVIDER,
  objectionWindowHours,
  paymentSummary,
  PROVIDER_BOOKING_TABS,
  PROVIDER_BOOKING_TRANSITIONS,
  providerActionBlockedReason,
  providerActionsFor,
} from "@/utils/provider-booking"
import { formatPrice } from "@/utils/format"
import { formatZonedDateTime } from "@/utils/zoned-time"

/**
 * The provider's bookings (PR-08, BR-02, BR-08, docs/provider-quotes-bookings-feature.md): the list
 * by tab, one booking in full, and the four actions (accept, decline, start, mark done). Every read
 * and write is scoped to the provider id from the session; another provider's booking is a 404.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const OBJECTION_SETTING = "booking.objectionWindowHours"


function toListItem(b: ProviderBookingRow, approved: boolean): ProviderBookingListItem {
  const unlocked = b.contactUnlockedAt !== null
  const method = b.payments[0]?.method ?? null
  return {
    id: b.id,
    number: b.number,
    source: b.source,
    title: b.service?.title ?? b.request?.title ?? "Booking",
    status: b.status,
    scheduledAt: b.scheduledAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    place: bookingPlace(b.addressSnapshot, unlocked),
    customerFirstName: firstName(b.customer.name),
    contactUnlocked: unlocked,
    amount: num(b.amount),
    providerNet: num(b.providerNet),
    paymentMethod: method,
    paymentSummary: paymentSummary(method, b.payments, b.status),
    autoReleaseAt: b.autoReleaseAt?.toISOString() ?? null,
    actions: providerActionsFor(b.status),
    acceptBlockedReason: b.status === "PENDING_PROVIDER" ? providerActionBlockedReason("ACCEPT", b.status, approved) : null,
  }
}

const isApproved = async (providerId: string) => (await repo.findVerificationStatus(providerId))?.verificationStatus === "APPROVED"

export async function listBookingsForProvider(providerId: string, query: ProviderBookingListQuery): Promise<ProviderBookingList> {
  const statuses = [...PROVIDER_BOOKING_TABS[query.tab]] as BookingStatus[]
  const where: Prisma.BookingWhereInput = {
    providerId,
    status: { in: statuses },
    ...(query.q
      ? {
          OR: [
            { number: { contains: query.q, mode: "insensitive" } },
            { service: { title: { contains: query.q, mode: "insensitive" } } },
            { request: { title: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  }
  // Current work: soonest first. History: latest first.
  const orderBy: Prisma.BookingOrderByWithRelationInput[] =
    query.tab === "current"
      ? [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }]
      : [{ scheduledAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]

  const [[rows, total], grouped, approved] = await Promise.all([
    repo.findBookingPage(where, orderBy, (query.page - 1) * query.perPage, query.perPage),
    repo.countBookingsByStatus(providerId),
    isApproved(providerId),
  ])
  const byStatus = new Map(grouped.filter((g) => !HIDDEN_FROM_PROVIDER.includes(g.status)).map((g) => [g.status, g._count._all]))
  const sum = (list: readonly BookingStatus[]) => list.reduce((s, st) => s + (byStatus.get(st) ?? 0), 0)

  return {
    items: rows.map((b) => toListItem(b, approved)),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts: { current: sum(PROVIDER_BOOKING_TABS.current), finished: sum(PROVIDER_BOOKING_TABS.finished), cancelled: sum(PROVIDER_BOOKING_TABS.cancelled) },
    toAccept: byStatus.get("PENDING_PROVIDER") ?? 0,
  }
}

function toDetail(b: ProviderBookingDetailRow, providerId: string, approved: boolean, windowHours: number): ProviderBookingDetail {
  const base = toListItem(b, approved)
  const unlocked = base.contactUnlocked
  const notes = b.notes ? (unlocked ? { text: b.notes, masked: false } : maskContactDetails(b.notes)) : null
  return {
    ...base,
    customer: {
      firstName: firstName(b.customer.name),
      fullName: unlocked ? b.customer.name || null : null,
      phone: unlocked ? b.customer.phone : null,
      address: unlocked ? bookingPlace(b.addressSnapshot, true) : null,
    },
    notes: notes?.text ?? null,
    notesMasked: notes?.masked ?? false,
    commissionRate: num(b.commissionRate),
    commissionAmount: num(b.commissionAmount),
    serviceId: b.serviceId,
    requestId: b.requestId,
    quote: b.quote ? { price: num(b.quote.price), durationDays: b.quote.durationDays } : null,
    cancelReason: b.cancelReason,
    cancelledBySelf: b.cancelledById === providerId,
    events: bookingEvents(b).map((e) => ({ ...e, at: e.at.toISOString() })),
    dispute: b.dispute,
    objectionWindowHours: windowHours,
  }
}

/** One booking for its provider, or `null` (unknown, someone else's, or not yet paid) → 404. */
export async function getBookingForProvider(providerId: string, id: string): Promise<ProviderBookingDetail | null> {
  const [b, approved, setting] = await Promise.all([repo.findBookingDetail(id, providerId), isApproved(providerId), repo.findSetting(OBJECTION_SETTING)])
  if (!b || HIDDEN_FROM_PROVIDER.includes(b.status)) return null
  return toDetail(b, providerId, approved, objectionWindowHours(setting))
}

const NOTIFY: Record<keyof typeof PROVIDER_BOOKING_TRANSITIONS, { type: "BOOKING_CONFIRMED" | "BOOKING_STATUS_CHANGED"; title: (n: string) => string }> = {
  ACCEPT: { type: "BOOKING_CONFIRMED", title: (n) => `Booking ${n} is confirmed` },
  DECLINE: { type: "BOOKING_STATUS_CHANGED", title: (n) => `The provider couldn't take booking ${n}` },
  START: { type: "BOOKING_STATUS_CHANGED", title: (n) => `Work on booking ${n} has started` },
  FINISH: { type: "BOOKING_STATUS_CHANGED", title: (n) => `The provider finished booking ${n} — please confirm` },
}

export async function updateBookingStatusByProvider(providerId: string, id: string, input: ProviderBookingStatusValues): Promise<ProviderBookingStatusDto> {
  const action = ACTION_BY_TARGET[input.status]!
  const t = PROVIDER_BOOKING_TRANSITIONS[action]

  return repo.transaction(async (tx) => {
    const booking = await repo.findBookingForUpdate(id, providerId, tx)
    if (!booking || HIDDEN_FROM_PROVIDER.includes(booking.status)) throw new NotFoundError("That booking doesn't exist.")
    const approved = (await repo.findVerificationStatus(providerId, tx))?.verificationStatus === "APPROVED"
    const blocked = providerActionBlockedReason(action, booking.status, approved)
    if (blocked) throw new ConflictError(blocked)

    const now = new Date()
    let data: Prisma.BookingUncheckedUpdateManyInput = { status: t.to }
    let release: Date | null = null
    if (action === "ACCEPT") data = { ...data, contactUnlockedAt: now } // BR-02: contact unlocks at confirmation
    if (action === "START") data = { ...data, startedAt: now }
    if (action === "FINISH") {
      release = autoReleaseAt(now, objectionWindowHours(await repo.findSetting(OBJECTION_SETTING, tx))) // BR-08
      data = { ...data, providerCompletedAt: now, autoReleaseAt: release }
    }
    const reason = input.status === "REJECTED" ? input.reason : undefined
    if (action === "DECLINE") data = { ...data, cancelledById: providerId, cancelReason: reason, cancelledAt: now }

    if ((await repo.transition(id, providerId, t.from, data, tx)) === 0) {
      throw new ConflictError("This booking just changed. Reload to see the latest.")
    }

    let refunded = 0
    if (action === "DECLINE") {
      const payments = booking.payments.map((p) => ({ ...p, amount: num(p.amount), refundedAmount: num(p.refundedAmount) }))
      for (const c of declinePaymentChanges(payments)) {
        await repo.updatePayment(c.id, { status: c.status, escrowState: c.escrowState, refundedAmount: c.refundedAmount }, tx)
        if (c.status === "REFUNDED") refunded += c.refundedAmount
      }
    }

    await auditRepository.createAuditLog(
      {
        actorId: providerId,
        action: t.audit,
        entityType: "Booking",
        entityId: id,
        metadata: { from: booking.status, to: t.to, ...(reason ? { reason } : {}), ...(refunded ? { refunded } : {}) },
      },
      tx,
    )
    const body =
      action === "DECLINE"
        ? `${reason}${refunded ? ` Your payment of ${formatPrice(refunded)} will be refunded.` : ""}`
        : action === "FINISH" && release
          ? `Confirm the job is done, or report a problem before ${formatZonedDateTime(release)}.`
          : null
    await auditRepository.createNotification(
      { userId: booking.customerId, type: NOTIFY[action].type, title: NOTIFY[action].title(booking.number), body, payload: { bookingId: id } },
      tx,
    )
    return { id, status: t.to }
  })
}
