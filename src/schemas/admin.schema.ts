import { z } from "zod"

/**
 * Admin decisions (docs/admin-dashboard-feature.md). Shared by the dashboard
 * forms and the `/api/admin/*` routes.
 */
export const REJECTION_REASON_MIN = 10
export const REJECTION_REASON_MAX = 500

/** AD-01: approve, or reject WITH a reason the provider will see. */
export const providerDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }),
  z.object({
    decision: z.literal("REJECT"),
    reason: z
      .string()
      .trim()
      .min(REJECTION_REASON_MIN, `Give the provider at least ${REJECTION_REASON_MIN} characters of explanation.`)
      .max(REJECTION_REASON_MAX, `Keep the reason under ${REJECTION_REASON_MAX} characters.`),
  }),
])

/** The reject dialog's form (the `decision` is fixed by the button that opened it). */
export const rejectProviderFormSchema = z.object({
  reason: providerDecisionSchema.options[1].shape.reason,
})

/** AD-05: the only transition the dashboard offers is OPEN → UNDER_REVIEW; resolving lives on the dispute page. */
export const disputeStatusSchema = z.object({ status: z.literal("UNDER_REVIEW") })

export type ProviderDecisionValues = z.infer<typeof providerDecisionSchema>
export type RejectProviderFormValues = z.infer<typeof rejectProviderFormSchema>
export type DisputeStatusValues = z.infer<typeof disputeStatusSchema>
