import "server-only"
import type { BookingStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const paymentSelect = { id: true, method: true, amount: true, refundedAmount: true, status: true, escrowState: true, paidAt: true, gatewayRef: true, gatewayPayload: true } satisfies Prisma.PaymentSelect

const detailSelect = {
  id: true,
  number: true,
  source: true,
  status: true,
  customerId: true,
  providerId: true,
  serviceId: true,
  requestId: true,
  scheduledAt: true,
  createdAt: true,
  amount: true,
  commissionRate: true,
  commissionAmount: true,
  addressSnapshot: true,
  notes: true,
  contactUnlockedAt: true,
  startedAt: true,
  providerCompletedAt: true,
  completedAt: true,
  autoReleaseAt: true,
  cancelledAt: true,
  cancelledById: true,
  cancelReason: true,
  service: { select: { title: true } },
  request: { select: { title: true } },
  provider: { select: { userId: true, user: { select: { name: true, phone: true, avatarUrl: true } } } },
  payments: { orderBy: { createdAt: "asc" }, select: paymentSelect },
  dispute: { select: { status: true, reason: true } },
} satisfies Prisma.BookingSelect

export type CustomerBookingDetailRow = Prisma.BookingGetPayload<{ select: typeof detailSelect }>

/**
 * One of the signed-in customer's bookings and the writes behind confirm / cancel (CU-09, CU-11;
 * docs/customer-booking-detail-feature.md). Every query is scoped by `customerId` from the session — a foreign id
 * finds nothing. Dumb queries; rules live in `utils/customer-booking-actions.ts` and `customer-booking.service.ts`.
 * Wallet, payment and completed-count writes reuse `ledger.repository.ts`.
 */
class CustomerBookingRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findDetail(id: string, customerId: string, client: Client = db) {
    return client.booking.findFirst({ where: { id, customerId }, select: detailSelect })
  }

  hasReviewed(bookingId: string, customerId: string) {
    return db.review.count({ where: { bookingId, reviewerId: customerId } }).then((n) => n > 0)
  }

  /** Conditional `from → to` in one UPDATE (race-safe). Returns the row count. */
  async transition(id: string, customerId: string, from: BookingStatus[], data: Prisma.BookingUncheckedUpdateManyInput, client: Client) {
    const { count } = await client.booking.updateMany({ where: { id, customerId, status: { in: from } }, data })
    return count
  }

  updatePayment(id: string, data: Prisma.PaymentUncheckedUpdateInput, client: Client) {
    return client.payment.update({ where: { id }, data, select: { id: true } })
  }

  findAdminIds(client: Client = db) {
    return client.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } })
  }

  createNotifications(data: Prisma.NotificationCreateManyInput[], client: Client = db) {
    return client.notification.createMany({ data })
  }
}

export const customerBookingRepository = new CustomerBookingRepository()
