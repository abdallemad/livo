import "server-only"
import type { PayoutStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const adminListSelect = {
  id: true,
  providerId: true,
  amount: true,
  status: true,
  destinationType: true,
  destinationRef: true,
  processedById: true,
  processedAt: true,
  rejectionReason: true,
  createdAt: true,
  provider: { select: { user: { select: { name: true, phone: true } } } },
} satisfies Prisma.PayoutSelect

export type AdminPayoutRow = Prisma.PayoutGetPayload<{ select: typeof adminListSelect }>

/** Payout + wallet ledger reads/writes (PR-11, PR-12, AD-07). Dumb queries; rules live in the service. */
class PayoutRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findAdminPage(where: Prisma.PayoutWhereInput, orderBy: Prisma.PayoutOrderByWithRelationInput[], skip: number, take: number) {
    return db.$transaction([
      db.payout.findMany({ where, orderBy, skip, take, select: adminListSelect }),
      db.payout.count({ where }),
    ])
  }

  sumByStatus() {
    return db.payout.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amount: true } })
  }

  findUserNames(ids: string[]) {
    return ids.length ? db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : Promise.resolve([])
  }

  /** Ledger balance per provider: `SUM(amount)`. */
  walletBalances(providerIds: string[], client: Client = db) {
    return client.walletTransaction.groupBy({ by: ["providerId"], where: { providerId: { in: providerIds } }, _sum: { amount: true } })
  }

  /** APPROVED-but-unpaid payouts of these providers (they reserve balance). */
  approvedPayouts(providerIds: string[], client: Client = db) {
    return client.payout.findMany({
      where: { providerId: { in: providerIds }, status: "APPROVED" },
      select: { id: true, providerId: true, amount: true },
    })
  }

  findForDecision(id: string, client: Client) {
    return client.payout.findUnique({ where: { id }, select: { id: true, providerId: true, amount: true, status: true, destinationRef: true } })
  }

  /**
   * Row lock on the provider so concurrent approvals / payments for the SAME provider run one
   * after another inside their transactions (the balance check can't be raced).
   */
  async lockProvider(providerId: string, client: Prisma.TransactionClient) {
    await client.$queryRaw`SELECT "userId" FROM "ProviderProfile" WHERE "userId" = ${providerId} FOR UPDATE`
  }

  /** Conditional `status IN from → to` in one UPDATE (race-safe). Returns the row count. */
  async transition(
    id: string,
    from: PayoutStatus[],
    data: { status: PayoutStatus; processedById: string; processedAt: Date; rejectionReason?: string },
    client: Client,
  ) {
    const { count } = await client.payout.updateMany({ where: { id, status: { in: from } }, data })
    return count
  }

  createPayoutLedgerRow(data: { providerId: string; payoutId: string; amount: number; note: string }, client: Client) {
    return client.walletTransaction.create({ data: { ...data, type: "PAYOUT", amount: -data.amount } })
  }
}

export const payoutRepository = new PayoutRepository()
