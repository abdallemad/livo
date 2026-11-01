import type { PayoutStatus, WalletTxType } from "@prisma/client"
import type { Paginated } from "./api"

/** Provider earnings (PR-11) and payouts (PR-12) — docs/provider-earnings-payouts-feature.md. Money in EGP. */

export interface WalletSummaryDto {
  /** `SUM` of the ledger; negative = commission owed from cash jobs. */
  balance: number
  /** Requested + approved payouts not paid yet. */
  openPayouts: number
  /** balance − open payouts, never below 0. */
  available: number
  /** Online payments still held in escrow, as the provider's future net (BR-08). */
  onHold: number
  onHoldBookings: number
  /** Payouts sent to the provider (PAYOUT rows). */
  paidOut: number
  /** Cash the provider collected themselves on completed cash jobs. */
  cashCollected: number
  /** Livo's commission on completed jobs (booking snapshots, BR-01). */
  commission: number
  /** Net credited this / last Cairo month (EARNING + REFUND_CLAWBACK). */
  thisMonth: number
  lastMonth: number
}

export interface LedgerEntryDto {
  id: string
  type: WalletTxType
  amount: number
  /** Wallet balance right after this entry. */
  balanceAfter: number
  note: string | null
  createdAt: string
  booking: { id: string; number: string; title: string } | null
}

export interface ProviderEarnings {
  summary: WalletSummaryDto
  ledger: Paginated<LedgerEntryDto>
}

export interface ProviderPayoutDto {
  id: string
  amount: number
  status: PayoutStatus
  destinationType: string
  /** Masked: "••••5678". */
  destination: string
  rejectionReason: string | null
  processedAt: string | null
  createdAt: string
}

export interface ProviderPayouts extends Paginated<ProviderPayoutDto> {
  summary: WalletSummaryDto
  /** `null` = a request may be sent (`payoutRequestBlockedReason` with the minimum amount). */
  requestBlockedReason: string | null
  /** Prefill from the latest request (unmasked — it's the provider's own). */
  lastDestination: { type: "WALLET" | "BANK"; ref: string } | null
}
