import "server-only"
import type { DisputeStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/** Dispute reads/writes. Dumb queries; rules live in `dispute.service.ts`. */
class DisputeRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findById(id: string, client: Client = db) {
    return client.dispute.findUnique({
      where: { id },
      select: { id: true, status: true, openedById: true, booking: { select: { id: true, number: true } } },
    })
  }

  /** Conditional `from → to` in one UPDATE (race-safe). Returns the row count. */
  async setStatus(id: string, from: DisputeStatus, to: DisputeStatus, client: Client) {
    const { count } = await client.dispute.updateMany({ where: { id, status: from }, data: { status: to } })
    return count
  }
}

export const disputeRepository = new DisputeRepository()
