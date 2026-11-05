import "server-only"
import type { BookingStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"
import { SERVICE_IMAGE_KEY } from "@/repositories/catalog.repository"

type Client = PrismaClient | Prisma.TransactionClient

const name = { select: { nameEn: true, nameAr: true } } as const

/** Bookings that block the provider's calendar (an unpaid checkout doesn't). */
export const CALENDAR_STATUSES: BookingStatus[] = ["PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"]

const confirmationSelect = {
  id: true,
  number: true,
  status: true,
  customerId: true,
  serviceId: true,
  scheduledAt: true,
  addressSnapshot: true,
  amount: true,
  service: { select: { title: true } },
  provider: { select: { user: { select: { name: true } } } },
  payments: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, method: true, status: true, gatewayRef: true } },
} satisfies Prisma.BookingSelect

export type BookingConfirmationRow = Prisma.BookingGetPayload<{ select: typeof confirmationSelect }>

/**
 * Booking a fixed-price service and its Stripe checkout (CU-02, CU-07; docs/booking-checkout-feature.md).
 * Dumb queries; every rule lives in `booking-checkout.service.ts`. Reads for the customer are scoped by the
 * customer id from the session.
 */
class BookingCheckoutRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** A LIVE service (the caller passes `VISIBLE_SERVICE`) with what the wizard and the money snapshot need. */
  findBookableService(id: string, visible: Prisma.ServiceWhereInput) {
    return db.service.findFirst({
      where: { AND: [visible, { id }] },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        durationMinutes: true,
        providerId: true,
        imageUrl: true,
        images: { where: { key: { startsWith: SERVICE_IMAGE_KEY } }, orderBy: { createdAt: "asc" }, take: 1, select: { id: true } },
        category: { select: { id: true, slug: true, parentId: true, ...name.select } },
        provider: {
          select: {
            userId: true,
            cityId: true,
            ratingAvg: true,
            ratingCount: true,
            user: { select: { name: true, avatarUrl: true } },
            availability: { select: { weekday: true, startTime: true, endTime: true } },
          },
        },
      },
    })
  }

  findCustomer(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        cityId: true,
        city: name,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          select: { id: true, label: true, street: true, details: true, cityId: true, isDefault: true, area: name, city: name },
        },
      },
    })
  }

  /** Start times of the provider's calendar-blocking bookings in a window. */
  findBusyStarts(providerId: string, from: Date, to: Date, client: Client = db) {
    return client.booking.findMany({
      where: { providerId, status: { in: CALENDAR_STATUSES }, scheduledAt: { gte: from, lt: to } },
      select: { scheduledAt: true },
    })
  }

  findGlobalCommission(client: Client = db) {
    return client.commissionSetting.findFirst({ where: { categoryId: null }, orderBy: { createdAt: "asc" }, select: { ratePercent: true } })
  }

  findCommissionOverrides(categoryIds: string[], client: Client = db) {
    return client.commissionSetting.findMany({ where: { categoryId: { in: categoryIds } }, select: { categoryId: true, ratePercent: true, isActive: true } })
  }

  /** The year's highest booking number (zero-padded, so text order is number order). */
  findLastNumber(prefix: string, client: Client) {
    return client.booking.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } })
  }

  createBooking(data: Prisma.BookingUncheckedCreateInput, client: Client) {
    return client.booking.create({ data, select: { id: true, number: true, status: true } })
  }

  createPayment(data: Prisma.PaymentUncheckedCreateInput, client: Client = db) {
    return client.payment.create({ data, select: { id: true } })
  }

  setGatewayRef(paymentId: string, gatewayRef: string) {
    return db.payment.update({ where: { id: paymentId }, data: { gatewayRef }, select: { id: true } })
  }

  /** Booking + its newest payment, only for this customer. */
  findCustomerBooking(bookingId: string, customerId: string) {
    return db.booking.findFirst({ where: { id: bookingId, customerId }, select: confirmationSelect })
  }

  findBookingForCheckout(bookingId: string, customerId: string) {
    return db.booking.findFirst({
      where: { id: bookingId, customerId },
      select: {
        id: true,
        number: true,
        status: true,
        amount: true,
        serviceId: true,
        service: { select: { title: true } },
        request: { select: { title: true } },
        customer: { select: { email: true } },
        payments: { orderBy: { createdAt: "desc" }, select: { id: true, method: true, status: true, gatewayRef: true } },
      },
    })
  }

  /** A failed / abandoned checkout attempt. Conditional, so a payment that just succeeded is never failed. */
  failPendingPayment(paymentId: string, payload: Prisma.InputJsonValue | undefined, client: Client = db) {
    return client.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "FAILED", ...(payload ? { gatewayPayload: payload } : {}) } })
  }

  cancelUnpaidBooking(bookingId: string, reason: string, client: Client = db) {
    return client.booking.updateMany({ where: { id: bookingId, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date() } })
  }

  // --- webhook ---------------------------------------------------------------

  findPaymentByGatewayRef(gatewayRef: string, client: Client = db) {
    return client.payment.findUnique({
      where: { gatewayRef },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        bookingId: true,
        booking: { select: { id: true, number: true, status: true, customerId: true, providerId: true, service: { select: { title: true } } } },
      },
    })
  }

  /** PENDING → PAID with the money HELD by Livo (escrow, BR-08). Returns the row count (0 = already handled). */
  markPaymentPaid(paymentId: string, payload: Prisma.InputJsonValue, paidAt: Date, client: Client) {
    return client.payment.updateMany({
      where: { id: paymentId, status: { in: ["PENDING", "FAILED"] } },
      data: { status: "PAID", escrowState: "HELD", paidAt, gatewayPayload: payload },
    })
  }

  /** PENDING_PAYMENT → PENDING_PROVIDER: the provider can now see and accept it (PR-08). */
  releaseToProvider(bookingId: string, client: Client) {
    return client.booking.updateMany({ where: { id: bookingId, status: "PENDING_PAYMENT" }, data: { status: "PENDING_PROVIDER" } })
  }

  createNotifications(data: Prisma.NotificationCreateManyInput[], client: Client) {
    return client.notification.createMany({ data })
  }

  createAuditLog(data: Prisma.AuditLogUncheckedCreateInput, client: Client) {
    return client.auditLog.create({ data })
  }

  findAdminIds(client: Client = db) {
    return client.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } })
  }
}

export const bookingCheckoutRepository = new BookingCheckoutRepository()
