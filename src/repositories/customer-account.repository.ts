import "server-only"
import type { BookingStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const place = { select: { nameEn: true, nameAr: true } } as const

const addressSelect = { id: true, label: true, street: true, details: true, areaId: true, isDefault: true, createdAt: true, area: place, city: place } satisfies Prisma.AddressSelect

const bookingSelect = {
  id: true,
  number: true,
  source: true,
  status: true,
  scheduledAt: true,
  createdAt: true,
  amount: true,
  addressSnapshot: true,
  contactUnlockedAt: true,
  autoReleaseAt: true,
  service: { select: { title: true } },
  request: { select: { title: true } },
  provider: { select: { userId: true, user: { select: { name: true, phone: true } } } },
  payments: { orderBy: { createdAt: "asc" }, take: 1, select: { method: true, status: true, escrowState: true } },
  dispute: { select: { status: true } },
} satisfies Prisma.BookingSelect

export type CustomerAddressRow = Prisma.AddressGetPayload<{ select: typeof addressSelect }>
export type CustomerBookingListRow = Prisma.BookingGetPayload<{ select: typeof bookingSelect }>

/**
 * The signed-in customer's settings, saved addresses, bookings, payments and invoices (AU-06, CU-13, CU-14,
 * SY-07). Every query is scoped by `userId` / `customerId` from the session. Dumb queries.
 */
class CustomerAccountRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findUser(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, avatarUrl: true, cityId: true, city: place, interests: { select: { categoryId: true } } },
    })
  }

  findActiveCategories() {
    return db.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: { id: true, nameEn: true, nameAr: true },
    })
  }

  findActiveAreas(cityId: string) {
    return db.area.findMany({ where: { cityId, isActive: true }, orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true, nameAr: true } })
  }

  // --- addresses -------------------------------------------------------------

  findAddresses(userId: string, client: Client = db) {
    return client.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], select: addressSelect })
  }

  findAddress(id: string, userId: string, client: Client = db) {
    return client.address.findFirst({ where: { id, userId }, select: addressSelect })
  }

  createAddress(data: Prisma.AddressUncheckedCreateInput, client: Client) {
    return client.address.create({ data, select: { id: true } })
  }

  async updateAddress(id: string, userId: string, data: Prisma.AddressUncheckedUpdateManyInput, client: Client) {
    const { count } = await client.address.updateMany({ where: { id, userId }, data })
    return count
  }

  async deleteAddress(id: string, userId: string, client: Client) {
    const { count } = await client.address.deleteMany({ where: { id, userId } })
    return count
  }

  /** Make `id` the only default (two statements in the caller's transaction). */
  async setDefault(id: string, userId: string, client: Client) {
    await client.address.updateMany({ where: { userId, isDefault: true, id: { not: id } }, data: { isDefault: false } })
    await client.address.updateMany({ where: { id, userId }, data: { isDefault: true } })
  }

  // --- bookings ---------------------------------------------------------------

  findBookingPage(where: Prisma.BookingWhereInput, orderBy: Prisma.BookingOrderByWithRelationInput[], skip: number, take: number) {
    return db.$transaction([db.booking.findMany({ where, orderBy, skip, take, select: bookingSelect }), db.booking.count({ where })])
  }

  countBookingsByStatus(customerId: string) {
    return db.booking.groupBy({ by: ["status"], where: { customerId }, _count: { _all: true } })
  }

  /** Booking ids on this page the customer has already reviewed. */
  findReviewedBookingIds(customerId: string, bookingIds: string[]) {
    return bookingIds.length
      ? db.review.findMany({ where: { reviewerId: customerId, bookingId: { in: bookingIds } }, select: { bookingId: true } })
      : Promise.resolve([])
  }

  // --- payments & invoices ------------------------------------------------------

  findPaymentPage(customerId: string, skip: number, take: number) {
    const where = { booking: { customerId } } satisfies Prisma.PaymentWhereInput
    return db.$transaction([
      db.payment.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
        select: {
          id: true,
          method: true,
          amount: true,
          refundedAmount: true,
          status: true,
          escrowState: true,
          paidAt: true,
          createdAt: true,
          milestone: { select: { title: true } },
          booking: { select: { id: true, number: true, service: { select: { title: true } }, request: { select: { title: true } } } },
        },
      }),
      db.payment.count({ where }),
    ])
  }

  findAllPaymentAmounts(customerId: string) {
    return db.payment.findMany({ where: { booking: { customerId } }, select: { method: true, status: true, escrowState: true, amount: true, refundedAmount: true } })
  }

  findInvoicePage(customerId: string, skip: number, take: number) {
    const where = { booking: { customerId } } satisfies Prisma.InvoiceWhereInput
    return db.$transaction([
      db.invoice.findMany({
        where,
        orderBy: [{ issuedAt: "desc" }, { id: "desc" }],
        skip,
        take,
        select: { id: true, number: true, total: true, issuedAt: true, fileId: true, booking: { select: { id: true, number: true, service: { select: { title: true } }, request: { select: { title: true } } } } },
      }),
      db.invoice.count({ where }),
    ])
  }

  countBookings(customerId: string, statuses: BookingStatus[]) {
    return db.booking.count({ where: { customerId, status: { in: statuses } } })
  }
}

export const customerAccountRepository = new CustomerAccountRepository()
