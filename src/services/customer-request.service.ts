import "server-only"
import type { Prisma } from "@prisma/client"
import { API_ROUTES } from "@/constants/api-routes"
import type { WorkStatus } from "@/constants/status"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { isStripeConfigured } from "@/lib/stripe"
import { auditRepository } from "@/repositories/audit.repository"
import { customerRequestRepository as repo, type CustomerRequestDetailRow } from "@/repositories/customer-request.repository"
import type { AcceptQuoteValues } from "@/schemas/customer.schema"
import { allocateBookingNumber, commissionFor, isUniqueViolation, openCheckoutSession } from "@/services/booking-checkout.service"
import type { AcceptedQuoteDto, CustomerQuoteDto, CustomerRequestDetail } from "@/types/customer"
import { splitAmount } from "@/utils/commission"
import { maskContactDetails } from "@/utils/contact-mask"
import { customerRequestState, lowestPrice, quoteAcceptBlockedReason, requestCancelBlockedReason, requestTimelineState } from "@/utils/customer-request"
import { formatPrice } from "@/utils/format"
import { zonedDaysBetween } from "@/utils/zoned-time"

/**
 * One of the customer's quote requests (`/account/requests/[id]`): the request, its quotes to compare (CU-04) and
 * accepting one, which creates the booking (CU-05) — docs/customer-request-detail-feature.md. The customer id always
 * comes from the session; someone else's request is a 404.
 *
 * Accepting is one transaction: request `OPEN → ACCEPTED`, the quote `PENDING → ACCEPTED`, every other waiting quote
 * `→ REJECTED`, a `QUOTE` booking with the money frozen (BR-01) and its payment row, audit and notifications. Online
 * payment then opens Stripe Checkout exactly like a service booking (docs/booking-checkout-feature.md).
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr
const NUMBER_RETRIES = 3

const providerActive = (q: CustomerRequestDetailRow["quotes"][number]) => q.provider.verificationStatus === "APPROVED" && q.provider.user.status === "ACTIVE"

function placeOf(r: CustomerRequestDetailRow): string | null {
  if (r.address) {
    const parts = [r.address.street, r.address.details, r.address.area ? label(r.address.area) : null, label(r.address.city)]
    return parts.filter((p): p is string => !!p && p.trim() !== "").join(", ")
  }
  const parts = [r.area ? label(r.area) : null, label(r.city)].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

function toDetail(r: CustomerRequestDetailRow, now: Date): CustomerRequestDetail {
  const pending = r.quotes.filter((q) => q.status === "PENDING").map((q) => num(q.price))
  const lowest = lowestPrice(pending)
  const booking = r.bookings[0] ?? null
  const paid = booking?.payments.find((p) => p.method === "ONLINE" && p.paidAt)
  const current = requestTimelineState({
    status: r.status,
    booking: booking ? { status: booking.status, paidOnline: !!paid, reviewed: booking.reviews.length > 0 } : null,
  })

  const events: { status: WorkStatus; at: string }[] = [{ status: "OPEN", at: r.createdAt.toISOString() }]
  if (booking) {
    events.push({ status: "ACCEPTED", at: booking.createdAt.toISOString() })
    if (paid?.paidAt) events.push({ status: "PAID", at: paid.paidAt.toISOString() })
    if (booking.startedAt) events.push({ status: "IN_PROGRESS", at: booking.startedAt.toISOString() })
    if (booking.completedAt) events.push({ status: "COMPLETED", at: booking.completedAt.toISOString() })
    if (booking.reviews[0]) events.push({ status: "REVIEWED", at: booking.reviews[0].createdAt.toISOString() })
    if (booking.cancelledAt) events.push({ status: "CANCELLED", at: booking.cancelledAt.toISOString() })
  }

  const quotes: CustomerQuoteDto[] = r.quotes.map((q) => {
    const message = q.message ? maskContactDetails(q.message) : null
    const price = num(q.price)
    return {
      id: q.id,
      price,
      durationDays: q.durationDays,
      message: message?.text ?? null,
      messageMasked: message?.masked ?? false,
      status: q.status,
      validUntil: q.validUntil?.toISOString() ?? null,
      createdAt: q.createdAt.toISOString(),
      isLowest: q.status === "PENDING" && lowest !== null && price === lowest && pending.length > 1,
      provider: {
        id: q.provider.userId,
        name: q.provider.user.name || "Provider",
        avatarUrl: q.provider.user.avatarUrl,
        rating: num(q.provider.ratingAvg),
        reviewsCount: q.provider.ratingCount,
        completedCount: q.provider.completedCount,
        yearsExperience: q.provider.yearsExperience,
      },
      acceptBlockedReason: quoteAcceptBlockedReason({ requestStatus: r.status, quoteStatus: q.status, validUntil: q.validUntil, providerActive: providerActive(q), now }),
    }
  })

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
    lowestPendingPrice: lowest,
    booking: booking ? { id: booking.id, number: booking.number, status: booking.status } : null,
    cancelBlockedReason: requestCancelBlockedReason(r.status),
    place: placeOf(r),
    photos: r.media.map((f) => ({ id: f.id, mimeType: f.mimeType, sizeBytes: f.sizeBytes, previewUrl: API_ROUTES.customer.file(f.id) })),
    timeline: { current, events },
    quotes,
    onlinePaymentAvailable: isStripeConfigured(),
  }
}

/** `GET /api/me/requests/[id]` and the page's first snapshot; `null` → 404. */
export async function getMyRequest(customerId: string, id: string, now = new Date()): Promise<CustomerRequestDetail | null> {
  const r = await repo.findDetail(id, customerId)
  return r ? toDetail(r, now) : null
}

/** `POST /api/me/requests/[id]/booking` — accept one quote (CU-05). */
export async function acceptQuote(customerId: string, requestId: string, values: AcceptQuoteValues, now = new Date()): Promise<AcceptedQuoteDto> {
  const first = await repo.findDetail(requestId, customerId)
  if (!first) throw new NotFoundError("That request doesn't exist.")
  if (values.paymentMethod === "ONLINE" && !isStripeConfigured()) {
    throw new ValidationError("Online payment isn't available right now.", { paymentMethod: ["Choose cash, or try again later."] })
  }
  const rate = await commissionFor(first.category)
  const online = values.paymentMethod === "ONLINE"

  let created: { booking: { id: string; number: string; status: AcceptedQuoteDto["status"] }; paymentId: string; title: string; amount: number } | null = null
  for (let attempt = 0; attempt < NUMBER_RETRIES && !created; attempt++) {
    try {
      created = await repo.transaction(async (tx) => {
        const r = await repo.findDetail(requestId, customerId, tx)
        if (!r) throw new NotFoundError("That request doesn't exist.")
        const q = r.quotes.find((x) => x.id === values.quoteId)
        if (!q) throw new NotFoundError("That quote isn't on this request.")
        const blocked = quoteAcceptBlockedReason({ requestStatus: r.status, quoteStatus: q.status, validUntil: q.validUntil, providerActive: providerActive(q), now })
        if (blocked) throw new ConflictError(blocked)
        if (q.providerId === customerId) throw new ValidationError("You can't accept your own quote.")

        if ((await repo.acceptRequest(r.id, customerId, tx)) === 0 || (await repo.acceptQuote(q.id, r.id, tx)) === 0) {
          throw new ConflictError("This request just changed. Reload to see the latest.")
        }
        const others = r.quotes.filter((x) => x.id !== q.id && x.status === "PENDING")
        await repo.rejectOtherQuotes(r.id, q.id, tx)

        const amount = num(q.price)
        const { commission, providerNet } = splitAmount(amount, rate)
        const booking = await repo.createBooking(
          {
            number: await allocateBookingNumber(tx, now),
            source: "QUOTE",
            customerId,
            providerId: q.providerId,
            requestId: r.id,
            quoteId: q.id,
            amount,
            commissionRate: rate,
            commissionAmount: commission,
            providerNet,
            status: online ? "PENDING_PAYMENT" : "PENDING_PROVIDER",
            // A project's date is agreed with the provider after acceptance; the request's wish is in its details.
            scheduledAt: null,
            addressSnapshot: r.address
              ? { label: r.address.label, city: label(r.address.city), area: r.address.area ? label(r.address.area) : null, street: r.address.street, details: r.address.details }
              : { city: label(r.city), area: r.area ? label(r.area) : null },
            notes: null,
          },
          tx,
        )
        const payment = await repo.createPayment({ bookingId: booking.id, method: values.paymentMethod, amount, status: "PENDING", escrowState: "NONE" }, tx)

        await auditRepository.createAuditLog(
          {
            actorId: customerId,
            action: "request.accept_quote",
            entityType: "ServiceRequest",
            entityId: r.id,
            metadata: { quoteId: q.id, bookingId: booking.id, amount, commissionRate: rate, method: values.paymentMethod, declined: others.length },
          },
          tx,
        )
        const notifications: Prisma.NotificationCreateManyInput[] = [
          {
            userId: q.providerId,
            type: "QUOTE_ACCEPTED",
            title: `Your quote on "${r.title}" was accepted`,
            body: online
              ? `${formatPrice(amount)} — the customer is paying online. Booking ${booking.number} appears in your bookings once paid.`
              : `${formatPrice(amount)}, paid in cash after the job. Accept booking ${booking.number} in your bookings.`,
            payload: { requestId: r.id, quoteId: q.id, bookingId: booking.id },
          },
          ...others.map((o) => ({
            userId: o.providerId,
            type: "SYSTEM" as const,
            title: `The customer chose another quote for "${r.title}"`,
            body: "Thanks for quoting — keep an eye on new requests.",
            payload: { requestId: r.id, quoteId: o.id },
          })),
        ]
        await repo.createNotifications(notifications, tx)
        return { booking, paymentId: payment.id, title: r.title, amount }
      })
    } catch (e) {
      if (isUniqueViolation(e) && attempt < NUMBER_RETRIES - 1) continue
      throw e
    }
  }
  const { booking, paymentId, title, amount } = created!

  if (!online) return { bookingId: booking.id, number: booking.number, status: booking.status, checkoutUrl: null, paymentError: false }
  try {
    const email = (await repo.findCustomerEmail(customerId))?.email ?? null
    const session = await openCheckoutSession({ bookingId: booking.id, number: booking.number, paymentId, serviceId: null, title, amount, email, now })
    return { bookingId: booking.id, number: booking.number, status: booking.status, checkoutUrl: session.url, paymentError: false }
  } catch (e) {
    // The quote is accepted and the booking exists: the customer pays from the booking page ("Pay now" starts a fresh session).
    console.error("[accept-quote] Stripe session failed", e)
    return { bookingId: booking.id, number: booking.number, status: booking.status, checkoutUrl: null, paymentError: true }
  }
}
