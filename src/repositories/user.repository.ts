import "server-only"
import type { Prisma, PrismaClient, UserStatus } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const adminListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  onboardingCompletedAt: true,
  city: { select: { nameEn: true, nameAr: true } },
} satisfies Prisma.UserSelect

const bookingSelect = {
  id: true,
  number: true,
  amount: true,
  status: true,
  createdAt: true,
  customerId: true,
  customer: { select: { name: true } },
  provider: { select: { user: { select: { name: true } } } },
} satisfies Prisma.BookingSelect

export type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminListSelect }>

/** The only place `User` rows are read or written. No business rules here. */
class UserRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findById(id: string) {
    return db.user.findUnique({ where: { id } })
  }

  /** The fields the proxy needs on every gated request; kept to one indexed lookup. */
  findGateById(id: string) {
    return db.user.findUnique({ where: { id }, select: { role: true, status: true, onboardingCompletedAt: true } })
  }

  create(data: Prisma.UserCreateInput) {
    return db.user.create({ data })
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return db.user.update({ where: { id }, data })
  }

  /** Paginated admin list: rows + total in one transaction. */
  findAdminPage(where: Prisma.UserWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: adminListSelect }),
      db.user.count({ where }),
    ])
  }

  findAdminDetail(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        ...adminListSelect,
        avatarUrl: true,
        deletedAt: true,
        providerProfile: { select: { verificationStatus: true } },
        _count: {
          select: { requests: true, bookingsAsCustomer: true, reviewsWritten: true, disputesOpened: true },
        },
      },
    })
  }

  countBookingsAsProvider(userId: string) {
    return db.booking.count({ where: { providerId: userId } })
  }

  /** Bookings on either side of the marketplace, newest first. */
  findRecentBookings(userId: string, take: number) {
    return db.booking.findMany({
      where: { OR: [{ customerId: userId }, { providerId: userId }] },
      orderBy: { createdAt: "desc" },
      take,
      select: bookingSelect,
    })
  }

  findStatus(id: string, client: Client = db) {
    return client.user.findUnique({ where: { id }, select: { role: true, status: true } })
  }

  /** Conditional `from → to` in one UPDATE (race-safe). Returns the row count. */
  async setStatus(id: string, from: UserStatus, to: UserStatus, client: Client) {
    const { count } = await client.user.updateMany({ where: { id, status: from }, data: { status: to } })
    return count
  }
}

export const userRepository = new UserRepository()
