import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const adminListSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  price: true,
  durationMinutes: true,
  isActive: true,
  hiddenByAdminAt: true,
  hiddenByAdminReason: true,
  createdAt: true,
  providerId: true,
  category: {
    select: { nameEn: true, nameAr: true, isActive: true, parent: { select: { nameEn: true, nameAr: true, isActive: true } } },
  },
  provider: { select: { verificationStatus: true, user: { select: { name: true, status: true } } } },
  _count: { select: { images: true, bookings: true } },
} satisfies Prisma.ServiceSelect

export type AdminServiceRow = Prisma.ServiceGetPayload<{ select: typeof adminListSelect }>

/** Fixed-price `Service` rows outside onboarding. Dumb queries; rules live in the services. */
class ServiceRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** Paginated admin list: rows + total in one transaction. */
  findAdminPage(where: Prisma.ServiceWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.service.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: adminListSelect }),
      db.service.count({ where }),
    ])
  }

  findForModeration(id: string, client: Client = db) {
    return client.service.findUnique({
      where: { id },
      select: { id: true, title: true, providerId: true, hiddenByAdminAt: true },
    })
  }

  /** Conditional hide / restore in one UPDATE (race-safe). Returns the row count. */
  async setHidden(id: string, hidden: { at: Date; reason: string } | null, client: Client) {
    const { count } = await client.service.updateMany({
      where: { id, hiddenByAdminAt: hidden ? null : { not: null } },
      data: { hiddenByAdminAt: hidden?.at ?? null, hiddenByAdminReason: hidden?.reason ?? null },
    })
    return count
  }
}

export const serviceRepository = new ServiceRepository()
