import "server-only"
import type { Prisma, PrismaClient, WalletTxType } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const toNum = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Number(v.toString()))

/**
 * The provider's own wallet ledger, escrow and payout requests (PR-11, PR-12). Every query is
 * scoped by `providerId` from the session. Dumb queries; rules live in `utils/provider-wallet.ts`
 * and the services.
 */
class ProviderWalletRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findProfileStatus(providerId: string, client: Client = db) {
    return client.providerProfile.findUnique({ where: { userId: providerId }, select: { verificationStatus: true, user: { select: { name: true } } } })
  }

  /** Same row lock as the admin decision (`payout.repository.ts`): requests and decisions for one provider run one at a time. */
  async lockProvider(providerId: string, client: Prisma.TransactionClient) {
    await client.$queryRaw`SELECT "userId" FROM "ProviderProfile" WHERE "userId" = ${providerId} FOR UPDATE`
  }

  async ledgerSum(providerId: string, filter: { types?: WalletTxType[]; from?: Date; to?: Date } = {}, client: Client = db) {
    const agg = await client.walletTransaction.aggregate({
      where: {
        providerId,
        ...(filter.types ? { type: { in: filter.types } } : {}),
        ...(filter.from || filter.to ? { createdAt: { ...(filter.from ? { gte: filter.from } : {}), ...(filter.to ? { lt: filter.to } : {}) } } : {}),
      },
      _sum: { amount: true },
    })
    return toNum(agg._sum.amount)
  }

  /** Newest first. Same order is used to compute running balances. */
  findLedgerPage(where: Prisma.WalletTransactionWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.walletTransaction.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
        select: {
          id: true,
          type: true,
          amount: true,
          note: true,
          createdAt: true,
          booking: { select: { id: true, number: true, service: { select: { title: true } }, request: { select: { title: true } } } },
        },
      }),
      db.walletTransaction.count({ where }),
    ])
  }

  /** Sum of every entry NEWER than (createdAt, id) — to turn the total into the balance right after an entry. */
  async sumNewerThan(providerId: string, createdAt: Date, id: string) {
    const agg = await db.walletTransaction.aggregate({
      where: { providerId, OR: [{ createdAt: { gt: createdAt } }, { createdAt, id: { gt: id } }] },
      _sum: { amount: true },
    })
    return toNum(agg._sum.amount)
  }

  /** Online money paid for this provider's bookings and still held in escrow. */
  findHeldPayments(providerId: string) {
    return db.payment.findMany({
      where: { escrowState: "HELD", status: { in: ["PAID", "PARTIALLY_REFUNDED"] }, booking: { providerId } },
      select: { amount: true, refundedAmount: true, bookingId: true, booking: { select: { commissionRate: true } } },
    })
  }

  async completedTotals(providerId: string) {
    const done = { providerId, status: { in: ["COMPLETED", "CLOSED"] } } satisfies Prisma.BookingWhereInput
    const [all, cash] = await Promise.all([
      db.booking.aggregate({ where: done, _sum: { commissionAmount: true } }),
      db.booking.aggregate({ where: { ...done, payments: { some: { method: "CASH" } } }, _sum: { amount: true } }),
    ])
    return { commission: toNum(all._sum.commissionAmount), cashCollected: toNum(cash._sum.amount) }
  }

  async openPayouts(providerId: string, client: Client = db) {
    const rows = await client.payout.findMany({ where: { providerId, status: { in: ["REQUESTED", "APPROVED"] } }, select: { amount: true, status: true } })
    return { total: rows.reduce((s, r) => s + toNum(r.amount), 0), requested: rows.filter((r) => r.status === "REQUESTED").length }
  }

  findPayoutPage(providerId: string, skip: number, take: number) {
    const where = { providerId }
    return db.$transaction([
      db.payout.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
        select: { id: true, amount: true, status: true, destinationType: true, destinationRef: true, rejectionReason: true, processedAt: true, createdAt: true },
      }),
      db.payout.count({ where }),
    ])
  }

  findLatestPayout(providerId: string) {
    return db.payout.findFirst({ where: { providerId }, orderBy: { createdAt: "desc" }, select: { destinationType: true, destinationRef: true } })
  }

  createPayout(data: { providerId: string; amount: number; destinationType: string; destinationRef: string }, client: Client) {
    return client.payout.create({ data, select: { id: true } })
  }

  findAdminIds(client: Client = db) {
    return client.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } })
  }

  createNotifications(data: Prisma.NotificationCreateManyInput[], client: Client) {
    return data.length ? client.notification.createMany({ data }) : Promise.resolve({ count: 0 })
  }
}

export const providerWalletRepository = new ProviderWalletRepository()
