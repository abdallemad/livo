import "server-only"
import type { DisputeResolution, DisputeStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const paymentSelect = { id: true, amount: true, refundedAmount: true, status: true, escrowState: true } satisfies Prisma.PaymentSelect

const adminListSelect = {
  id: true,
  reason: true,
  status: true,
  resolution: true,
  refundAmount: true,
  createdAt: true,
  resolvedAt: true,
  openedById: true,
  openedBy: { select: { name: true } },
  booking: {
    select: {
      id: true,
      number: true,
      amount: true,
      customerId: true,
      providerId: true,
      customer: { select: { name: true } },
      provider: { select: { user: { select: { name: true } } } },
      payments: { select: paymentSelect },
    },
  },
  _count: { select: { evidence: true } },
} satisfies Prisma.DisputeSelect

const adminDetailSelect = {
  ...adminListSelect,
  resolutionNote: true,
  resolvedBy: { select: { name: true } },
  evidence: { orderBy: { createdAt: "asc" }, select: { id: true, mimeType: true, sizeBytes: true, createdAt: true } },
  booking: {
    select: {
      ...adminListSelect.booking.select,
      status: true,
      source: true,
      commissionRate: true,
      scheduledAt: true,
      completedAt: true,
      service: { select: { title: true } },
      request: { select: { title: true } },
      payments: { orderBy: { createdAt: "asc" }, select: { ...paymentSelect, method: true, milestone: { select: { title: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, senderId: true, body: true, contactBlocked: true, createdAt: true, sender: { select: { name: true } } },
      },
    },
  },
} satisfies Prisma.DisputeSelect

export type AdminDisputeRow = Prisma.DisputeGetPayload<{ select: typeof adminListSelect }>
export type AdminDisputeDetailRow = Prisma.DisputeGetPayload<{ select: typeof adminDetailSelect }>

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

  /** Paginated admin list: rows + total in one transaction. */
  findAdminPage(where: Prisma.DisputeWhereInput, orderBy: Prisma.DisputeOrderByWithRelationInput, skip: number, take: number) {
    return db.$transaction([
      db.dispute.findMany({ where, orderBy, skip, take, select: adminListSelect }),
      db.dispute.count({ where }),
    ])
  }

  countByStatus() {
    return db.dispute.groupBy({ by: ["status"], _count: { _all: true } })
  }

  findAdminDetail(id: string) {
    return db.dispute.findUnique({ where: { id }, select: adminDetailSelect })
  }

  /** Everything the settlement needs, read inside the resolving transaction. */
  findForResolve(id: string, client: Client) {
    return client.dispute.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        openedById: true,
        booking: {
          select: {
            id: true,
            number: true,
            status: true,
            customerId: true,
            providerId: true,
            commissionRate: true,
            payments: { orderBy: { createdAt: "asc" }, select: paymentSelect },
          },
        },
      },
    })
  }

  /** Conditional `from → to` in one UPDATE (race-safe). Returns the row count. */
  async setStatus(id: string, from: DisputeStatus, to: DisputeStatus, client: Client) {
    const { count } = await client.dispute.updateMany({ where: { id, status: from }, data: { status: to } })
    return count
  }

  /** Conditional OPEN/UNDER_REVIEW → RESOLVED, so two admins can't both settle (and move money twice). */
  async resolve(
    id: string,
    data: { resolution: DisputeResolution; refundAmount: number | null; note: string; by: string; at: Date },
    client: Client,
  ) {
    const { count } = await client.dispute.updateMany({
      where: { id, status: { in: ["OPEN", "UNDER_REVIEW"] } },
      data: {
        status: "RESOLVED",
        resolution: data.resolution,
        refundAmount: data.refundAmount,
        resolutionNote: data.note,
        resolvedById: data.by,
        resolvedAt: data.at,
      },
    })
    return count
  }
}

export const disputeRepository = new DisputeRepository()
