import "server-only"
import { Prisma } from "@prisma/client"
import type Stripe from "stripe"
import { ConflictError, NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/errors"
import { absoluteUrl } from "@/lib/site-url"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { bookingCheckoutRepository as repo, type BookingConfirmationRow } from "@/repositories/booking-checkout.repository"
import type { CreateServiceBookingValues } from "@/schemas/booking.schema"
import { VISIBLE_SERVICE } from "@/services/admin-catalog.service"
import { DEFAULT_GLOBAL_RATE } from "@/services/commission.service"
import { pushStoredNotifications, type StoredNotification } from "@/services/notification.service"
import type { BookingConfirmationDto, BookServiceFormData, CheckoutSessionDto, CreatedBookingDto } from "@/types/booking"
import type { DayHours } from "@/utils/availability"
import { BOOKING_MAX_DAYS, bookableDays, nextBookingNumber, slotInstant, slotProblem, toMinorUnits } from "@/utils/booking-checkout"
import { serviceHref } from "@/utils/catalog"
import { resolveCommissionRate, splitAmount } from "@/utils/commission"
import { bookingPlace } from "@/utils/provider-booking"
import { zonedIsoDay } from "@/utils/zoned-time"
import { serviceCoverUrl } from "@/utils/service-image"

/**
 * Booking a fixed-price service + Stripe Checkout (CU-02, CU-07, BR-01, BR-08; docs/booking-checkout-feature.md).
 *
 *   wizard ─POST /api/me/bookings─▶ Booking PENDING_PAYMENT + Payment(ONLINE, PENDING) ─▶ Stripe Checkout (hosted)
 *        Stripe ─POST /api/webhook/stripe─▶ Payment PAID / escrow HELD, Booking PENDING_PROVIDER, provider notified
 *   cash: Booking PENDING_PROVIDER + Payment(CASH, PENDING) straight away (paid to the provider after the job).
 *
 * **The webhook is the fact, the redirect is a convenience** (CLAUDE.md §8). The confirmation step may also ask Stripe
 * directly (`reconcileCheckout`) when the redirect beats the webhook — it applies the same idempotent `markCheckoutPaid`,
 * with data read from Stripe using the secret key, never from the browser.
 *
 * The customer id always comes from the session. Price, provider and commission come from the service row; the money
 * snapshot (amount, rate, commission, provider net) is frozen on the booking now (BR-01).
 */

const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr
const num = (v: { toString(): string }) => Number(v.toString())
const CURRENCY = "usd"
/** Stripe's minimum lifetime for a Checkout session is 30 minutes; one hour leaves room to type card details. */
const CHECKOUT_TTL_SECONDS = 60 * 60
const NUMBER_RETRIES = 3

function toHours(rows: { weekday: number; startTime: string; endTime: string }[]): DayHours[] {
  const byDay = new Map<number, DayHours>()
  for (const r of rows) {
    const day = byDay.get(r.weekday) ?? { weekday: r.weekday, ranges: [] }
    day.ranges.push({ start: r.startTime, end: r.endTime })
    byDay.set(r.weekday, day)
  }
  return [...byDay.values()]
}

async function loadService(serviceId: string) {
  const service = await repo.findBookableService(serviceId, VISIBLE_SERVICE)
  if (!service) throw new NotFoundError("This service isn't available to book right now.")
  return service
}

async function busyStarts(providerId: string, now: Date) {
  const rows = await repo.findBusyStarts(providerId, new Date(now.getTime() - 86_400_000), new Date(now.getTime() + (BOOKING_MAX_DAYS + 1) * 86_400_000))
  return rows.flatMap((r) => (r.scheduledAt ? [r.scheduledAt] : []))
}

const addressLabel = (a: { label: string | null; street: string; area: { nameEn: string | null; nameAr: string } | null }) =>
  [a.label, a.area ? label(a.area) : null, a.street].filter(Boolean).join(" · ")

// ---------------------------------------------------------------------------
// Wizard data
// ---------------------------------------------------------------------------

export async function getBookServiceFormData(userId: string, serviceId: string, now = new Date()): Promise<BookServiceFormData | null> {
  const [service, customer] = await Promise.all([repo.findBookableService(serviceId, VISIBLE_SERVICE), repo.findCustomer(userId)])
  if (!service || !customer) return null
  const p = service.provider
  const busy = await busyStarts(p.userId, now)

  return {
    service: {
      id: service.id,
      title: service.title,
      price: num(service.price),
      durationMinutes: service.durationMinutes,
      category: label(service.category),
      imageUrl: serviceCoverUrl(service.images.map((i) => i.id), service.imageUrl),
      href: serviceHref(service.category.slug, service.slug),
      provider: { id: p.userId, name: p.user.name || "Provider", avatarUrl: p.user.avatarUrl, rating: num(p.ratingAvg), reviewsCount: p.ratingCount },
    },
    city: customer.city ? label(customer.city) : null,
    // The provider works in one city; only addresses there are offered.
    addresses: customer.addresses.filter((a) => a.cityId === p.cityId).map((a) => ({ id: a.id, label: addressLabel(a), isDefault: a.isDefault })),
    days: bookableDays({ now, hours: toHours(p.availability), busy, durationMinutes: service.durationMinutes }),
    paymentMethods: [
      { id: "ONLINE", available: isStripeConfigured() },
      { id: "CASH", available: true },
    ],
  }
}

// ---------------------------------------------------------------------------
// Create the booking
// ---------------------------------------------------------------------------

/** The commission rate a new booking freezes (BR-01): category → parent → global. Shared with quote bookings. */
export async function commissionFor(category: { id: string; parentId: string | null }) {
  const [global, overrides] = await Promise.all([
    repo.findGlobalCommission(),
    repo.findCommissionOverrides([category.id, ...(category.parentId ? [category.parentId] : [])]),
  ])
  const rules = overrides.map((o) => ({ categoryId: o.categoryId!, ratePercent: num(o.ratePercent), isActive: o.isActive }))
  return resolveCommissionRate(category, rules, global ? num(global.ratePercent) : DEFAULT_GLOBAL_RATE).rate
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"

export async function createServiceBooking(userId: string, values: CreateServiceBookingValues, now = new Date()): Promise<CreatedBookingDto> {
  const [service, customer] = await Promise.all([loadService(values.serviceId), repo.findCustomer(userId)])
  if (!customer) throw new NotFoundError("Your account wasn't found.")
  const p = service.provider
  if (p.userId === userId) throw new ValidationError("You can't book your own service.")

  const address = customer.addresses.find((a) => a.id === values.addressId)
  if (!address) throw new ValidationError("Choose one of your addresses.", { addressId: ["That address isn't in your account."] })
  if (address.cityId !== p.cityId) throw new ValidationError("Choose an address in the provider's city.", { addressId: ["This provider doesn't work in that city."] })

  if (values.paymentMethod === "ONLINE" && !isStripeConfigured()) {
    throw new ValidationError("Online payment isn't available right now.", { paymentMethod: ["Choose cash, or try again later."] })
  }

  const hours = toHours(p.availability)
  const problem = slotProblem(values.date, values.time, { now, hours, busy: await busyStarts(p.userId, now), durationMinutes: service.durationMinutes })
  if (problem) throw new ValidationError(problem, { time: [problem] })
  const scheduledAt = slotInstant(values.date, values.time)!

  const amount = num(service.price)
  const rate = await commissionFor(service.category)
  const { commission, providerNet } = splitAmount(amount, rate)
  const online = values.paymentMethod === "ONLINE"
  const year = Number(zonedIsoDay(now).slice(0, 4))
  const title = service.title

  let created: { booking: { id: string; number: string; status: CreatedBookingDto["status"] }; paymentId: string; notifications: StoredNotification[] } | null = null
  for (let attempt = 0; attempt < NUMBER_RETRIES && !created; attempt++) {
    try {
      created = await repo.transaction(async (tx) => {
        // Re-checked inside the transaction so two customers can't take the same slot at the same moment
        // (still a check-then-insert; the provider can decline a clash — docs "Not done").
        const busy = (await repo.findBusyStarts(p.userId, new Date(scheduledAt.getTime() - 86_400_000), new Date(scheduledAt.getTime() + 86_400_000), tx)).flatMap((r) =>
          r.scheduledAt ? [r.scheduledAt] : [],
        )
        const clash = slotProblem(values.date, values.time, { now, hours, busy, durationMinutes: service.durationMinutes })
        if (clash) throw new ValidationError(clash, { time: [clash] })

        const last = await repo.findLastNumber(`LV-${year}-`, tx)
        const booking = await repo.createBooking(
          {
            number: nextBookingNumber(last?.number ?? null, year),
            source: "SERVICE",
            customerId: userId,
            providerId: p.userId,
            serviceId: service.id,
            amount,
            commissionRate: rate,
            commissionAmount: commission,
            providerNet,
            status: online ? "PENDING_PAYMENT" : "PENDING_PROVIDER",
            scheduledAt,
            addressSnapshot: {
              label: address.label,
              city: label(address.city),
              area: address.area ? label(address.area) : null,
              street: address.street,
              details: address.details,
            },
            notes: values.notes ?? null,
          },
          tx,
        )
        const payment = await repo.createPayment({ bookingId: booking.id, method: values.paymentMethod, amount, status: "PENDING", escrowState: "NONE" }, tx)
        await repo.createAuditLog(
          { actorId: userId, action: "booking.create", entityType: "Booking", entityId: booking.id, metadata: { serviceId: service.id, amount, commissionRate: rate, method: values.paymentMethod } },
          tx,
        )
        const notifications: StoredNotification[] = []
        if (!online) {
          // Cash: nothing to wait for — the provider sees it now (PR-08).
          notifications.push({ userId: p.userId, type: "BOOKING_CREATED", title: `New booking ${booking.number}`, body: `${title} — accept or decline it. Paid in cash after the job.`, payload: { bookingId: booking.id } })
          await repo.createNotifications(notifications.map((n) => ({ ...n, payload: { bookingId: booking.id } })), tx)
        }
        return { booking, paymentId: payment.id, notifications }
      })
    } catch (e) {
      // Two bookings took the same number at once: read the new highest and try again.
      if (isUniqueViolation(e) && attempt < NUMBER_RETRIES - 1) continue
      throw e
    }
  }
  const { booking, paymentId } = created!
  // After the commit: a cash booking reaches the provider's bell at once (docs/notifications-feature.md).
  await pushStoredNotifications(created!.notifications)

  if (!online) return { ...booking, checkoutUrl: null }

  try {
    const session = await openCheckoutSession({ bookingId: booking.id, number: booking.number, paymentId, serviceId: service.id, title, amount, email: customer.email, now })
    return { ...booking, checkoutUrl: session.url! }
  } catch (e) {
    // Never leave a booking the customer can't pay for: undo it so they can simply try again.
    await repo.failPendingPayment(paymentId, undefined).catch(() => undefined)
    await repo.cancelUnpaidBooking(booking.id, "Online payment couldn't start.").catch(() => undefined)
    throw toCheckoutError(e)
  }
}

/** The next `LV-<year>-NNNNNN` number, read inside the caller's transaction (retry the transaction on a P2002 clash). */
export async function allocateBookingNumber(tx: Prisma.TransactionClient, now = new Date()) {
  const year = Number(zonedIsoDay(now).slice(0, 4))
  const last = await repo.findLastNumber(`LV-${year}-`, tx)
  return nextBookingNumber(last?.number ?? null, year)
}

export { isUniqueViolation }

// ---------------------------------------------------------------------------
// Stripe Checkout
// ---------------------------------------------------------------------------

function toCheckoutError(e: unknown) {
  if (e instanceof ServiceUnavailableError || e instanceof ValidationError || e instanceof ConflictError) return e
  console.error("[checkout] Stripe session failed", e)
  return new ServiceUnavailableError("We couldn't open the payment page. Try again, or choose cash.")
}

export async function openCheckoutSession(input: {
  bookingId: string
  number: string
  paymentId: string
  serviceId: string | null
  title: string
  amount: number
  email: string | null
  now: Date
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  const back = (state: "success" | "cancelled") =>
    // Service bookings come back to the wizard's confirmation step; quote bookings to the booking page.
    absoluteUrl(
      input.serviceId
        ? `/account/book/${encodeURIComponent(input.serviceId)}?booking=${encodeURIComponent(input.bookingId)}&checkout=${state}`
        : `/account/bookings/${encodeURIComponent(input.bookingId)}?checkout=${state}`,
    )
  const metadata = { kind: "booking", bookingId: input.bookingId, paymentId: input.paymentId, bookingNumber: input.number }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            // Inline price: every booking has its own frozen amount, so there is no reusable Stripe Price to cache.
            unit_amount: toMinorUnits(input.amount),
            product_data: { name: input.title, description: `Livo booking ${input.number}` },
          },
        },
      ],
      client_reference_id: input.bookingId,
      metadata,
      payment_intent_data: { metadata, description: `Livo booking ${input.number}` },
      ...(input.email ? { customer_email: input.email } : {}),
      success_url: back("success"),
      cancel_url: back("cancelled"),
      expires_at: Math.floor(input.now.getTime() / 1000) + CHECKOUT_TTL_SECONDS,
    },
    // One session per payment row: a double submit returns the same session instead of a second charge.
    { idempotencyKey: `livo-checkout-${input.paymentId}` },
  )
  await repo.setGatewayRef(input.paymentId, session.id)
  return session
}

/**
 * `POST /api/me/bookings/[id]/checkout` — pay (or retry paying) an unpaid booking: "Pay now" in My bookings and
 * the confirmation step. An open session is reused; an expired / abandoned one is closed first (so it can't be paid
 * twice) and a fresh payment row + session is created.
 */
export async function startCheckout(userId: string, bookingId: string, now = new Date()): Promise<CheckoutSessionDto> {
  const booking = await repo.findBookingForCheckout(bookingId, userId)
  if (!booking) throw new NotFoundError("That booking wasn't found.")
  if (booking.status !== "PENDING_PAYMENT") throw new ConflictError("This booking doesn't need a payment any more.")
  const stripe = getStripe()

  const pending = booking.payments.find((p) => p.method === "ONLINE" && p.status === "PENDING")
  if (pending?.gatewayRef) {
    const session = await stripe.checkout.sessions.retrieve(pending.gatewayRef).catch((e) => {
      throw toCheckoutError(e)
    })
    if (session.status === "open" && session.url) return { checkoutUrl: session.url }
    if (session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
      await markCheckoutPaid(session, "reconcile")
      throw new ConflictError("This booking is already paid.")
    }
    await repo.failPendingPayment(pending.id, { sessionId: session.id, sessionStatus: session.status, closedAt: now.toISOString() })
  } else if (pending) {
    await repo.failPendingPayment(pending.id, undefined)
  }

  const payment = await repo.createPayment({ bookingId: booking.id, method: "ONLINE", amount: num(booking.amount), status: "PENDING", escrowState: "NONE" })
  try {
    const session = await openCheckoutSession({
      bookingId: booking.id,
      number: booking.number,
      paymentId: payment.id,
      serviceId: booking.serviceId,
      title: booking.service?.title ?? booking.request?.title ?? "Livo booking",
      amount: num(booking.amount),
      email: booking.customer.email,
      now,
    })
    return { checkoutUrl: session.url! }
  } catch (e) {
    await repo.failPendingPayment(payment.id, undefined).catch(() => undefined)
    throw toCheckoutError(e)
  }
}

// ---------------------------------------------------------------------------
// Confirmation step
// ---------------------------------------------------------------------------

const toConfirmation = (b: BookingConfirmationRow): BookingConfirmationDto => {
  const payment = b.payments[0] ?? null
  return {
    id: b.id,
    number: b.number,
    status: b.status,
    title: b.service?.title ?? "Booking",
    serviceId: b.serviceId,
    providerName: b.provider.user.name || "Your provider",
    scheduledAt: b.scheduledAt?.toISOString() ?? null,
    place: bookingPlace(b.addressSnapshot, true),
    amount: num(b.amount),
    payment: payment ? { method: payment.method, status: payment.status } : null,
    canPay: b.status === "PENDING_PAYMENT",
  }
}

/**
 * `GET /api/me/bookings/[id]/confirmation`. If the booking still waits for an online payment that has a session,
 * ask Stripe once (the redirect can arrive before the webhook, and local dev may have no webhook forwarding).
 */
export async function getBookingConfirmation(userId: string, bookingId: string): Promise<BookingConfirmationDto> {
  let booking = await repo.findCustomerBooking(bookingId, userId)
  if (!booking) throw new NotFoundError("That booking wasn't found.")

  const payment = booking.payments[0]
  if (booking.status === "PENDING_PAYMENT" && payment?.method === "ONLINE" && payment.status === "PENDING" && payment.gatewayRef && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(payment.gatewayRef)
      if (await reconcileSession(session)) booking = (await repo.findCustomerBooking(bookingId, userId)) ?? booking
    } catch (e) {
      console.error("[checkout] reconcile failed", e)
    }
  }
  return toConfirmation(booking)
}

async function reconcileSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
    return (await markCheckoutPaid(session, "reconcile")) === "paid"
  }
  if (session.status === "expired") {
    return (await markCheckoutFailed(session, "reconcile")) === "failed"
  }
  return false
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

type Outcome = "paid" | "failed" | "ignored" | "duplicate"

const sessionPayload = (session: Stripe.Checkout.Session, source: string, eventId?: string): Prisma.InputJsonValue => ({
  source,
  ...(eventId ? { eventId } : {}),
  sessionId: session.id,
  paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
  amountTotal: session.amount_total,
  currency: session.currency,
  paymentStatus: session.payment_status,
})

/**
 * The one function that turns a Stripe session into "paid" (webhook and reconcile both call it). Idempotent:
 * a second delivery finds the payment already PAID and does nothing. Refuses a session whose amount, currency
 * or metadata don't match our row (logged; the payment stays pending for an admin to look at).
 */
export async function markCheckoutPaid(session: Stripe.Checkout.Session, source: "webhook" | "reconcile", eventId?: string): Promise<Outcome> {
  const payment = await repo.findPaymentByGatewayRef(session.id)
  if (!payment || session.metadata?.kind !== "booking") return "ignored"
  if (session.metadata?.paymentId !== payment.id || session.metadata?.bookingId !== payment.bookingId) {
    console.error("[checkout] session metadata doesn't match payment", { sessionId: session.id, paymentId: payment.id })
    return "ignored"
  }
  if (session.currency !== CURRENCY || session.amount_total !== toMinorUnits(num(payment.amount))) {
    console.error("[checkout] paid amount doesn't match booking", { sessionId: session.id, amountTotal: session.amount_total, currency: session.currency })
    return "ignored"
  }

  const b = payment.booking
  const result = await repo.transaction(async (tx) => {
    if ((await repo.markPaymentPaid(payment.id, sessionPayload(session, source, eventId), new Date(), tx)).count === 0) return { outcome: "duplicate" as const, notifications: [] }
    const released = (await repo.releaseToProvider(b.id, tx)).count > 0
    await repo.createAuditLog(
      { actorId: null, action: "payment.paid", entityType: "Booking", entityId: b.id, metadata: { paymentId: payment.id, amount: num(payment.amount), sessionId: session.id, source } },
      tx,
    )
    const title = b.service?.title ?? "your booking"
    const notifications: Prisma.NotificationCreateManyInput[] = [
      { userId: b.customerId, type: "PAYMENT_UPDATE", title: `Payment received for ${b.number}`, body: "Livo holds it safely until you confirm the job is done.", payload: { bookingId: b.id } },
    ]
    if (released) {
      notifications.push({ userId: b.providerId, type: "BOOKING_CREATED", title: `New booking ${b.number}`, body: `${title} — paid online. Accept or decline it.`, payload: { bookingId: b.id } })
    } else {
      // Money arrived for a booking that is no longer waiting for payment (e.g. an admin cancelled it during checkout).
      const admins = await repo.findAdminIds(tx)
      notifications.push(
        ...admins.map((a) => ({
          userId: a.id,
          type: "PAYMENT_UPDATE" as const,
          title: `Payment for ${b.number} needs a refund`,
          body: `The customer paid while the booking was ${b.status.toLowerCase().replace(/_/g, " ")}. The money is held; refund it from Stripe.`,
          payload: { bookingId: b.id, paymentId: payment.id },
        })),
      )
      await repo.createAuditLog(
        { actorId: null, action: "payment.paid_after_close", entityType: "Booking", entityId: b.id, metadata: { paymentId: payment.id, bookingStatus: b.status } },
        tx,
      )
    }
    await repo.createNotifications(notifications, tx)
    return { outcome: "paid" as const, notifications }
  })

  // After the commit: "New booking" for the provider, "Payment received" for the customer — live (docs/notifications-feature.md).
  await pushStoredNotifications(
    result.notifications.map((n) => ({ userId: n.userId, type: n.type, title: n.title, body: n.body, payload: n.payload as StoredNotification["payload"] })),
  )
  return result.outcome
}

/** Expired / failed checkout: the attempt fails, the booking stays PENDING_PAYMENT so the customer can pay again. */
export async function markCheckoutFailed(session: Stripe.Checkout.Session, source: "webhook" | "reconcile", eventId?: string): Promise<Outcome> {
  const payment = await repo.findPaymentByGatewayRef(session.id)
  if (!payment) return "ignored"
  const { count } = await repo.failPendingPayment(payment.id, sessionPayload(session, source, eventId))
  return count ? "failed" : "duplicate"
}

/** Dispatch a verified Stripe event (`POST /api/webhook/stripe`). Unknown types are acknowledged and ignored. */
export async function handleStripeEvent(event: Stripe.Event): Promise<Outcome> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      // Delayed methods complete first with `unpaid` and settle via `async_payment_succeeded`.
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return "ignored"
      return markCheckoutPaid(session, "webhook", event.id)
    }
    case "checkout.session.async_payment_succeeded":
      return markCheckoutPaid(event.data.object, "webhook", event.id)
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      return markCheckoutFailed(event.data.object, "webhook", event.id)
    default:
      return "ignored"
  }
}

// ---------------------------------------------------------------------------
// Refunds & closing sessions (customer cancellation — docs/customer-booking-detail-feature.md)
// ---------------------------------------------------------------------------

/** The payment intent a verified webhook / reconcile stored on the payment row (`gatewayPayload.paymentIntent`). */
export function paymentIntentOf(gatewayPayload: unknown): string | null {
  if (!gatewayPayload || typeof gatewayPayload !== "object") return null
  const pi = (gatewayPayload as Record<string, unknown>).paymentIntent
  return typeof pi === "string" && pi.startsWith("pi_") ? pi : null
}

/**
 * Refund captured money on Stripe. Idempotent per payment row (a retry never refunds twice). Returns false when it
 * couldn't be sent (Stripe not configured, no payment intent, API error) — the caller then asks an admin to do it.
 */
export async function refundOnStripe(input: { paymentId: string; gatewayPayload: unknown; amount: number; reason: string }): Promise<boolean> {
  const paymentIntent = paymentIntentOf(input.gatewayPayload)
  if (!paymentIntent || !isStripeConfigured() || input.amount <= 0) return false
  try {
    await getStripe().refunds.create(
      { payment_intent: paymentIntent, amount: toMinorUnits(input.amount), reason: "requested_by_customer", metadata: { paymentId: input.paymentId, note: input.reason.slice(0, 450) } },
      { idempotencyKey: `livo-refund-${input.paymentId}` },
    )
    return true
  } catch (e) {
    console.error("[refund] Stripe refund failed", { paymentId: input.paymentId }, e)
    return false
  }
}

/**
 * Close a still-open Checkout session so a cancelled booking can't be paid afterwards. Best effort: if the customer
 * paid in the meantime, the webhook's "paid after close" path flags it for a refund.
 */
export async function expireOpenSession(sessionId: string): Promise<void> {
  if (!isStripeConfigured() || !sessionId.startsWith("cs_")) return
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status === "open") await stripe.checkout.sessions.expire(sessionId)
  } catch (e) {
    console.error("[checkout] couldn't expire session", { sessionId }, e)
  }
}
