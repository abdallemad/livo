import "server-only"
import type { PaymentStatus, Prisma } from "@prisma/client"
import { paymentRepository as repo, type AdminPaymentRow } from "@/repositories/payment.repository"
import type { PaymentListQuery } from "@/schemas/admin.schema"
import type { AdminPaymentList, AdminPaymentListItem } from "@/types/admin"
import { summarizePayments } from "@/utils/payment-summary"

/**
 * Payments for admins (AD-07, docs/admin-payments-feature.md): every payment row with its
 * booking and parties, counts per status, and money totals (captured / held / released /
 * refunded / cash). **Read-only**: money moves only through the gateway webhook, the
 * booking's auto-release (BR-08) and dispute decisions (AD-05) — never from this page.
 * Callers must already have passed `requireAdmin()`.
 */

const num = (value: { toString(): string } | null | undefined) => (value == null ? 0 : Number(value.toString()))

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"]

const toListItem = (p: AdminPaymentRow): AdminPaymentListItem => ({
  id: p.id,
  method: p.method,
  amount: num(p.amount),
  refundedAmount: num(p.refundedAmount),
  status: p.status,
  escrowState: p.escrowState,
  milestone: p.milestone?.title ?? null,
  gatewayRef: p.gatewayRef,
  paidAt: p.paidAt?.toISOString() ?? null,
  releasedAt: p.releasedAt?.toISOString() ?? null,
  createdAt: p.createdAt.toISOString(),
  bookingId: p.booking.id,
  bookingNumber: p.booking.number,
  bookingStatus: p.booking.status,
  bookingTitle: p.booking.service?.title ?? p.booking.request?.title ?? "—",
  commissionRate: num(p.booking.commissionRate),
  customerId: p.booking.customerId,
  customerName: p.booking.customer.name || "Unnamed customer",
  providerId: p.booking.providerId,
  providerName: p.booking.provider.user.name || "Unnamed provider",
  dispute: p.booking.dispute && p.booking.dispute.status !== "RESOLVED" ? p.booking.dispute : null,
})

export async function listPaymentsForAdmin(query: PaymentListQuery): Promise<AdminPaymentList> {
  const where: Prisma.PaymentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.method ? { method: query.method } : {}),
    ...(query.escrow ? { escrowState: query.escrow } : {}),
    ...(query.q
      ? {
          OR: [
            { id: query.q },
            { gatewayRef: { contains: query.q, mode: "insensitive" } },
            { booking: { number: { contains: query.q, mode: "insensitive" } } },
            { booking: { customer: { name: { contains: query.q, mode: "insensitive" } } } },
            { booking: { provider: { user: { name: { contains: query.q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  }

  const [[rows, total], byStatus, groups] = await Promise.all([
    repo.findAdminPage(where, (query.page - 1) * query.perPage, query.perPage),
    repo.countByStatus(),
    repo.sumByMethodStatusEscrow(),
  ])

  const counts = Object.fromEntries(PAYMENT_STATUSES.map((s) => [s, 0])) as Record<PaymentStatus, number>
  for (const g of byStatus) counts[g.status] = g._count._all

  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts,
    summary: summarizePayments(
      groups.map((g) => ({
        method: g.method,
        status: g.status,
        escrowState: g.escrowState,
        count: g._count._all,
        amount: num(g._sum.amount),
        refundedAmount: num(g._sum.refundedAmount),
      })),
    ),
  }
}
