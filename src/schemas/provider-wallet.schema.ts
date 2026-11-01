import { z } from "zod"
import { normalizeDestination, PAYOUT_MAX, PAYOUT_MIN } from "@/utils/provider-wallet"
import { paginationQuerySchema } from "./common.schema"

/** Provider earnings (PR-11) and payout requests (PR-12) — docs/provider-earnings-payouts-feature.md. */

export const LEDGER_TYPES = ["EARNING", "COMMISSION_DEBT", "PAYOUT", "REFUND_CLAWBACK", "ADJUSTMENT"] as const

export const ledgerQuerySchema = paginationQuerySchema.extend({
  type: z.enum(LEDGER_TYPES).optional(),
  perPage: z.coerce.number().int().min(1).max(50).default(15),
})
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>

export const providerPayoutListQuerySchema = paginationQuerySchema.extend({
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})
export type ProviderPayoutListQuery = z.infer<typeof providerPayoutListQuerySchema>

export const PAYOUT_DESTINATION_TYPES = ["WALLET", "BANK"] as const

/**
 * `POST /api/provider/payouts`. The destination is normalized here (`normalizeDestination`); whether
 * the amount fits the wallet is checked in the service, under a lock.
 */
export const payoutRequestSchema = z
  .object({
    amount: z.coerce
      .number({ error: "Enter the amount in numbers." })
      .min(PAYOUT_MIN, `The minimum payout is ${PAYOUT_MIN} EGP.`)
      .max(PAYOUT_MAX, `The maximum payout is ${PAYOUT_MAX.toLocaleString("en")} EGP.`)
      .multipleOf(0.01, "Use at most two decimal places."),
    destinationType: z.enum(PAYOUT_DESTINATION_TYPES, { error: "Choose where to send the money." }),
    destinationRef: z.string().trim().min(1, "Enter where to send the money.").max(64),
  })
  .transform((v, ctx) => {
    const d = normalizeDestination(v.destinationType, v.destinationRef)
    if (!d.ok) {
      ctx.addIssue({ code: "custom", path: ["destinationRef"], message: d.error })
      return z.NEVER
    }
    return { ...v, destinationRef: d.value }
  })
export type PayoutRequestInput = z.input<typeof payoutRequestSchema>
export type PayoutRequestValues = z.output<typeof payoutRequestSchema>
