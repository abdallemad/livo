import "server-only"
import type { BookingStatus, EscrowState, PaymentStatus, Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/**
 * Money rows touched by a dispute settlement: payments, the provider wallet
 * ledger (PR-11, append-only), the booking's final status and the provider's
 * denormalised completed-jobs counter. Dumb writes; `dispute.service.ts`
 * decides the amounts (via `utils/dispute-settlement.ts`) and runs them in one transaction.
 */
class LedgerRepository {
  /** What this booking has credited to the provider so far (earnings minus claw-backs). */
  async sumBookingEarnings(bookingId: string, client: Client = db) {
    const agg = await client.walletTransaction.aggregate({
      where: { bookingId, type: { in: ["EARNING", "REFUND_CLAWBACK"] } },
      _sum: { amount: true },
    })
    return agg._sum.amount ? Number(agg._sum.amount.toString()) : 0
  }

  updatePayment(
    id: string,
    data: { refundedAmount: number; status: PaymentStatus; escrowState: EscrowState; releasedAt?: Date },
    client: Client,
  ) {
    return client.payment.update({ where: { id }, data })
  }

  createWalletEntry(data: Prisma.WalletTransactionUncheckedCreateInput, client: Client) {
    return client.walletTransaction.create({ data })
  }

  /** Conditional `DISPUTED → to` (a dispute on an already-closed booking leaves it alone). */
  async closeDisputedBooking(bookingId: string, to: BookingStatus, client: Client) {
    const { count } = await client.booking.updateMany({ where: { id: bookingId, status: "DISPUTED" }, data: { status: to } })
    return count
  }

  /** Keeps `ProviderProfile.completedCount` equal to its COMPLETED + CLOSED bookings. */
  async refreshCompletedCount(providerId: string, client: Client) {
    const completedCount = await client.booking.count({ where: { providerId, status: { in: ["COMPLETED", "CLOSED"] } } })
    await client.providerProfile.update({ where: { userId: providerId }, data: { completedCount } })
  }
}

export const ledgerRepository = new LedgerRepository()
