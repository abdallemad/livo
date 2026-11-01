import "server-only"
import type { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { providerWalletRepository as repo } from "@/repositories/provider-wallet.repository"
import type { LedgerQuery, PayoutRequestValues, ProviderPayoutListQuery } from "@/schemas/provider-wallet.schema"
import type { LedgerEntryDto, ProviderEarnings, ProviderPayouts, WalletSummaryDto } from "@/types/provider-wallet"
import { formatPrice } from "@/utils/format"
import { availableToRequest, heldNet, maskDestination, PAYOUT_MIN, payoutRequestBlockedReason } from "@/utils/provider-wallet"
import { zonedMonthRange } from "@/utils/zoned-time"

/**
 * The provider's wallet (PR-11) and payout requests (PR-12) — docs/provider-earnings-payouts-feature.md.
 * Ledger model shared with the admin payouts page: balance = SUM(ledger); PAYOUT rows are written when
 * an admin marks a payout paid. The provider id always comes from the session.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const cents = (n: number) => Math.round(n * 100) / 100

export async function getWalletSummary(providerId: string, now = new Date()): Promise<WalletSummaryDto> {
  const month = zonedMonthRange(now)
  const lastMonth = zonedMonthRange(new Date(month.start.getTime() - 86_400_000))
  const net = ["EARNING", "REFUND_CLAWBACK"] as const
  const [balance, open, held, totals, paidOut, thisMonth, previous] = await Promise.all([
    repo.ledgerSum(providerId),
    repo.openPayouts(providerId),
    repo.findHeldPayments(providerId),
    repo.completedTotals(providerId),
    repo.ledgerSum(providerId, { types: ["PAYOUT"] }),
    repo.ledgerSum(providerId, { types: [...net], from: month.start, to: month.end }),
    repo.ledgerSum(providerId, { types: [...net], from: lastMonth.start, to: lastMonth.end }),
  ])
  return {
    balance: cents(balance),
    openPayouts: cents(open.total),
    available: availableToRequest(balance, open.total),
    onHold: heldNet(held.map((p) => ({ amount: num(p.amount), refundedAmount: num(p.refundedAmount), commissionRate: num(p.booking.commissionRate) }))),
    onHoldBookings: new Set(held.map((p) => p.bookingId)).size,
    paidOut: cents(-paidOut),
    cashCollected: cents(totals.cashCollected),
    commission: cents(totals.commission),
    thisMonth: cents(thisMonth),
    lastMonth: cents(previous),
  }
}

export async function getEarnings(providerId: string, query: LedgerQuery): Promise<ProviderEarnings> {
  const where: Prisma.WalletTransactionWhereInput = { providerId, ...(query.type ? { type: query.type } : {}) }
  const [summary, [rows, total]] = await Promise.all([getWalletSummary(providerId), repo.findLedgerPage(where, (query.page - 1) * query.perPage, query.perPage)])

  // Balance right after each entry. Unfiltered pages are consecutive, so one query anchors the first row;
  // a type filter skips rows in between, so each row is anchored on its own (≤ perPage small aggregates).
  let after: number[]
  if (!rows.length) after = []
  else if (!query.type) {
    const first = cents(summary.balance - (await repo.sumNewerThan(providerId, rows[0].createdAt, rows[0].id)))
    after = rows.reduce<number[]>((acc, r, i) => [...acc, i === 0 ? first : cents(acc[i - 1] - num(rows[i - 1].amount))], [])
  } else {
    after = await Promise.all(rows.map(async (r) => cents(summary.balance - (await repo.sumNewerThan(providerId, r.createdAt, r.id)))))
  }

  const items: LedgerEntryDto[] = rows.map((r, i) => ({
    id: r.id,
    type: r.type,
    amount: num(r.amount),
    balanceAfter: after[i],
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    booking: r.booking ? { id: r.booking.id, number: r.booking.number, title: r.booking.service?.title ?? r.booking.request?.title ?? "Booking" } : null,
  }))
  return { summary, ledger: { items, total, page: query.page, perPage: query.perPage, pageCount: Math.max(1, Math.ceil(total / query.perPage)) } }
}

export async function getPayouts(providerId: string, query: ProviderPayoutListQuery): Promise<ProviderPayouts> {
  const [profile, summary, open, [rows, total], latest] = await Promise.all([
    repo.findProfileStatus(providerId),
    getWalletSummary(providerId),
    repo.openPayouts(providerId),
    repo.findPayoutPage(providerId, (query.page - 1) * query.perPage, query.perPage),
    repo.findLatestPayout(providerId),
  ])
  return {
    items: rows.map((p) => ({
      id: p.id,
      amount: num(p.amount),
      status: p.status,
      destinationType: p.destinationType,
      destination: maskDestination(p.destinationRef),
      rejectionReason: p.rejectionReason,
      processedAt: p.processedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    summary,
    requestBlockedReason: payoutRequestBlockedReason({
      providerApproved: profile?.verificationStatus === "APPROVED",
      hasOpenRequest: open.requested > 0,
      amount: Math.max(PAYOUT_MIN, summary.available),
      available: summary.available,
    }),
    // Only reuse a real (unmasked) destination; seeded ones are masked placeholders.
    lastDestination:
      latest && (latest.destinationType === "WALLET" || latest.destinationType === "BANK") && !latest.destinationRef.includes("•")
        ? { type: latest.destinationType, ref: latest.destinationRef }
        : null,
  }
}

/**
 * PR-12: ask Livo to send money. One transaction under the same provider row lock as the admin's
 * decisions, so the balance check can't be raced by a double click or an admin action.
 */
export async function requestPayout(providerId: string, values: PayoutRequestValues): Promise<{ id: string }> {
  return repo.transaction(async (tx) => {
    const profile = await repo.findProfileStatus(providerId, tx)
    if (!profile) throw new NotFoundError("This account has no provider profile.")
    await repo.lockProvider(providerId, tx)
    const [balance, open] = await Promise.all([repo.ledgerSum(providerId, {}, tx), repo.openPayouts(providerId, tx)])
    const available = availableToRequest(balance, open.total)
    const blocked = payoutRequestBlockedReason({ providerApproved: profile.verificationStatus === "APPROVED", hasOpenRequest: open.requested > 0, amount: values.amount, available })
    if (blocked) {
      // Amount problems belong on the field; account / open-request problems are conflicts.
      if (profile.verificationStatus === "APPROVED" && open.requested === 0 && available >= PAYOUT_MIN) throw new ValidationError("Check the amount.", { amount: [blocked] })
      throw new ConflictError(blocked)
    }

    const payout = await repo.createPayout({ providerId, amount: values.amount, destinationType: values.destinationType, destinationRef: values.destinationRef }, tx)
    await auditRepository.createAuditLog(
      { actorId: providerId, action: "payout.request", entityType: "Payout", entityId: payout.id, metadata: { amount: values.amount, destinationType: values.destinationType, balanceBefore: cents(balance) } },
      tx,
    )
    const admins = await repo.findAdminIds(tx)
    await repo.createNotifications(
      admins.map((a) => ({
        userId: a.id,
        type: "SYSTEM" as const,
        title: `New payout request: ${formatPrice(values.amount)}`,
        body: `${profile.user.name || "A provider"} asked for a payout.`,
        payload: { payoutId: payout.id },
      })),
      tx,
    )
    return payout
  })
}
