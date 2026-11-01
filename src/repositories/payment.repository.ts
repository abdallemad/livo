import "server-only"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

const adminListSelect = {
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
  booking: {
    select: {
      id: true,
      number: true,
      status: true,
      customerId: true,
      providerId: true,
      commissionRate: true,
      customer: { select: { name: true } },
      provider: { select: { user: { select: { name: true } } } },
      service: { select: { title: true } },
      request: { select: { title: true } },
      dispute: { select: { id: true, status: true } },
    },
  },
} satisfies Prisma.PaymentSelect

export type AdminPaymentRow = Prisma.PaymentGetPayload<{ select: typeof adminListSelect }>

/** Payment reads for the admin review page (AD-07). Dumb queries; rules live in the services. */
class PaymentRepository {
  /** Paginated admin list (newest first): rows + total in one transaction. */
  findAdminPage(where: Prisma.PaymentWhereInput, skip: number, take: number) {
    return db.$transaction([
      db.payment.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take, select: adminListSelect }),
      db.payment.count({ where }),
    ])
  }

  countByStatus() {
    return db.payment.groupBy({ by: ["status"], _count: { _all: true } })
  }

  /** Money buckets for the summary cards, over every payment (not the filtered view). */
  sumByMethodStatusEscrow() {
    return db.payment.groupBy({
      by: ["method", "status", "escrowState"],
      _count: { _all: true },
      _sum: { amount: true, refundedAmount: true },
    })
  }
}

export const paymentRepository = new PaymentRepository()
