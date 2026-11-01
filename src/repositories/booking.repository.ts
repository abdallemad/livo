import "server-only"
import type { BookingStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const adminListSelect = {
  id: true,
  number: true,
  source: true,
  customerId: true,
  providerId: true,
  amount: true,
  commissionAmount: true,
  status: true,
  scheduledAt: true,
  createdAt: true,
  customer: { select: { name: true } },
  provider: { select: { user: { select: { name: true } } } },
  service: { select: { title: true } },
  request: { select: { title: true } },
  // The first payment row decides the method / escrow shown in the list.
  payments: { orderBy: { createdAt: "asc" }, take: 1, select: { method: true, escrowState: true } },
} satisfies Prisma.BookingSelect

const adminDetailSelect = {
  ...adminListSelect,
  serviceId: true,
  requestId: true,
  commissionRate: true,
  providerNet: true,
  notes: true,
  addressSnapshot: true,
  contactUnlockedAt: true,
  startedAt: true,
  providerCompletedAt: true,
  completedAt: true,
  autoReleaseAt: true,
  cancelledById: true,
  cancelReason: true,
  cancelledAt: true,
  payments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      method: true,
      amount: true,
      status: true,
      escrowState: true,
      refundedAmount: true,
      gatewayRef: true,
      paidAt: true,
      releasedAt: true,
      createdAt: true,
      milestone: { select: { title: true } },
    },
  },
  milestones: {
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, amount: true, status: true, dueAt: true },
  },
  messages: {
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, body: true, contactBlocked: true, createdAt: true, sender: { select: { name: true } } },
  },
  reviews: {
    orderBy: { createdAt: "asc" },
    select: { id: true, reviewerId: true, rating: true, comment: true, isHidden: true, createdAt: true },
  },
  dispute: { select: { id: true, status: true, reason: true } },
} satisfies Prisma.BookingSelect

export type AdminBookingRow = Prisma.BookingGetPayload<{ select: typeof adminListSelect }>
export type AdminBookingDetailRow = Prisma.BookingGetPayload<{ select: typeof adminDetailSelect }>

/** Booking reads/writes. Dumb queries; rules live in the services. */
class BookingRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** Paginated admin list: rows + total in one transaction. */
  findAdminPage(where: Prisma.BookingWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: adminListSelect }),
      db.booking.count({ where }),
    ])
  }

  countByStatus() {
    return db.booking.groupBy({ by: ["status"], _count: { _all: true } })
  }

  findAdminDetail(id: string) {
    return db.booking.findUnique({ where: { id }, select: adminDetailSelect })
  }

  findUserName(id: string) {
    return db.user.findUnique({ where: { id }, select: { name: true } })
  }

  findForCancel(id: string, client: Client = db) {
    return client.booking.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        customerId: true,
        providerId: true,
        payments: { select: { status: true, escrowState: true } },
      },
    })
  }

  /** Conditional `status IN from → CANCELLED` in one UPDATE (race-safe). Returns the row count. */
  async cancel(id: string, from: BookingStatus[], data: { by: string; reason: string; at: Date }, client: Client) {
    const { count } = await client.booking.updateMany({
      where: { id, status: { in: from } },
      data: { status: "CANCELLED", cancelledById: data.by, cancelReason: data.reason, cancelledAt: data.at },
    })
    return count
  }

  /** An unpaid online payment can't be completed for a cancelled booking. */
  failPendingPayments(bookingId: string, client: Client) {
    return client.payment.updateMany({ where: { bookingId, status: "PENDING" }, data: { status: "FAILED" } })
  }
}

export const bookingRepository = new BookingRepository()
