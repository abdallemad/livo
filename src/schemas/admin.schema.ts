import { z } from "zod"
import { COMMISSION_MAX, COMMISSION_MIN } from "@/utils/commission"
import { paginationQuerySchema } from "./common.schema"

/**
 * Admin decisions and list filters (docs/admin-dashboard-feature.md,
 * docs/admin-providers-users-feature.md). Shared by the admin forms/hooks
 * and the `/api/admin/*` routes.
 */
export const REASON_MIN = 10
export const REASON_MAX = 500

/** Query-string text search: trimmed, empty → undefined. */
const searchSchema = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => v || undefined)

/** A reason the affected user will see (rejection, suspension). */
export const reasonSchema = z
  .string()
  .trim()
  .min(REASON_MIN, `Give at least ${REASON_MIN} characters of explanation.`)
  .max(REASON_MAX, `Keep the reason under ${REASON_MAX} characters.`)

/**
 * AD-01 provider verification transitions. Which `from` status each one needs
 * lives in `provider-review.service.ts`:
 * APPROVE / REJECT: PENDING → …, SUSPEND: APPROVED → SUSPENDED, REINSTATE: SUSPENDED → APPROVED.
 */
export const PROVIDER_DECISIONS = ["APPROVE", "REJECT", "SUSPEND", "REINSTATE"] as const
export type ProviderDecision = (typeof PROVIDER_DECISIONS)[number]

export const providerDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }),
  z.object({ decision: z.literal("REJECT"), reason: reasonSchema }),
  z.object({ decision: z.literal("SUSPEND"), reason: reasonSchema }),
  z.object({ decision: z.literal("REINSTATE") }),
])

/** Any "type a reason" dialog (reject provider, suspend provider, suspend user). */
export const reasonFormSchema = z.object({ reason: reasonSchema })

export const DISPUTE_RESOLUTIONS = ["RELEASE_TO_PROVIDER", "PARTIAL_REFUND", "FULL_REFUND", "NO_ACTION"] as const
export const RESOLUTION_NOTE_MAX = 1000

/**
 * AD-05 dispute transitions on `PATCH /api/admin/disputes/[id]/status`:
 * OPEN → UNDER_REVIEW ("I'm on it"), or OPEN/UNDER_REVIEW → RESOLVED with a
 * decision. Which resolutions are allowed for the booking's money, and the
 * refund limits, are checked by `utils/dispute-settlement.ts` in the service.
 */
export const disputeStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("UNDER_REVIEW") }),
  z.object({
    status: z.literal("RESOLVED"),
    resolution: z.enum(DISPUTE_RESOLUTIONS, { error: "Choose a decision." }),
    refundAmount: z.coerce.number({ error: "Enter an amount." }).positive("Enter an amount above 0.").multipleOf(0.01).optional(),
    note: z
      .string()
      .trim()
      .min(REASON_MIN, `Explain the decision in at least ${REASON_MIN} characters.`)
      .max(RESOLUTION_NOTE_MAX, `Keep the note under ${RESOLUTION_NOTE_MAX} characters.`),
  }),
])

/** The resolve form (before the `status` literal is added by the hook). */
export const resolveDisputeFormSchema = disputeStatusSchema.options[1].omit({ status: true }).superRefine((v, ctx) => {
  if (v.resolution === "PARTIAL_REFUND" && v.refundAmount === undefined) {
    ctx.addIssue({ code: "custom", path: ["refundAmount"], message: "Enter the amount to refund." })
  }
})

export const ADMIN_DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED"] as const

export const disputeListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ADMIN_DISPUTE_STATUSES).optional(),
  q: searchSchema,
})

/** `/admin/reviews` filters (AD-08). `direction`: who wrote it (SY-05 reviews go both ways). */
export const reviewListQuerySchema = paginationQuerySchema.extend({
  visibility: z.enum(["VISIBLE", "HIDDEN"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  direction: z.enum(["OF_PROVIDER", "OF_CUSTOMER"]).optional(),
  q: searchSchema,
})

/** AD-08: hide (with a reason the reviewer sees) or show a review again. */
export const reviewModerationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("HIDE"), reason: reasonSchema }),
  z.object({ action: z.literal("SHOW") }),
])


export const ADMIN_PROVIDER_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT"] as const

/** `/admin/providers` — one status tab at a time (default: the review queue). */
export const providerListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ADMIN_PROVIDER_STATUSES).default("PENDING"),
  q: searchSchema,
})

export const ADMIN_USER_ROLES = ["CUSTOMER", "PROVIDER", "ADMIN"] as const
export const ADMIN_USER_STATUSES = ["ACTIVE", "SUSPENDED", "DELETED"] as const

/** `/admin/users` — search by name / email / phone, optional role + status filters. */
export const userListQuerySchema = paginationQuerySchema.extend({
  role: z.enum(ADMIN_USER_ROLES).optional(),
  status: z.enum(ADMIN_USER_STATUSES).optional(),
  q: searchSchema,
})

/** AD-03: suspend (with a reason the user sees) or re-activate. */
export const userStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("SUSPENDED"), reason: reasonSchema }),
  z.object({ status: z.literal("ACTIVE") }),
])

export type ProviderDecisionValues = z.infer<typeof providerDecisionSchema>
export type ReasonFormValues = z.infer<typeof reasonFormSchema>
export type ProviderListQuery = z.infer<typeof providerListQuerySchema>
export type ProviderListStatus = (typeof ADMIN_PROVIDER_STATUSES)[number]
export type UserListQuery = z.infer<typeof userListQuerySchema>
export type UserStatusValues = z.infer<typeof userStatusSchema>

/** `/admin/services` visibility filter: what a visitor would see right now. */
export const SERVICE_VISIBILITIES = ["LIVE", "PROVIDER_OFF", "HIDDEN_BY_ADMIN", "PROVIDER_INACTIVE", "CATEGORY_OFF"] as const
export type ServiceVisibility = (typeof SERVICE_VISIBILITIES)[number]

export const serviceListQuerySchema = paginationQuerySchema.extend({
  q: searchSchema,
  categoryId: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => v || undefined),
  visibility: z.enum(SERVICE_VISIBILITIES).optional(),
})

/** AD-02 moderation: hide (with a reason the provider sees) or restore a listing. */
export const serviceModerationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("HIDE"), reason: reasonSchema }),
  z.object({ action: z.literal("RESTORE") }),
])

export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>
export type ServiceModerationValues = z.infer<typeof serviceModerationSchema>

// ---------------------------------------------------------------------------
// Requests & bookings (AD-04, docs/admin-requests-bookings-feature.md)
// ---------------------------------------------------------------------------

const optionalId = z
  .string()
  .trim()
  .max(64)
  .optional()
  .transform((v) => v || undefined)

export const ADMIN_REQUEST_STATUSES = ["DRAFT", "OPEN", "ACCEPTED", "CANCELLED", "EXPIRED"] as const

export const requestListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ADMIN_REQUEST_STATUSES).optional(),
  categoryId: optionalId,
  q: searchSchema,
})

export const ADMIN_BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING_PROVIDER",
  "CONFIRMED",
  "IN_PROGRESS",
  "AWAITING_CONFIRMATION",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
  "REJECTED",
  "DISPUTED",
] as const
export const ADMIN_BOOKING_SOURCES = ["SERVICE", "QUOTE"] as const

export const bookingListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ADMIN_BOOKING_STATUSES).optional(),
  source: z.enum(ADMIN_BOOKING_SOURCES).optional(),
  q: searchSchema,
})

/**
 * Admin cancellation of a request (DRAFT/OPEN) or an unpaid booking — always with a reason both
 * sides see. Sent to `PATCH …/[id]/status` (status changes are a sub-resource, CLAUDE.md §2.1).
 */
export const adminCancelStatusSchema = z.object({ status: z.literal("CANCELLED"), reason: reasonSchema })

// ---------------------------------------------------------------------------
// Payments (AD-07, docs/admin-payments-feature.md) — read-only review
// ---------------------------------------------------------------------------

export const ADMIN_PAYMENT_STATUSES = ["PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"] as const
export const ADMIN_PAYMENT_METHODS = ["ONLINE", "CASH"] as const
export const ADMIN_ESCROW_STATES = ["NONE", "HELD", "RELEASED", "PARTIALLY_REFUNDED", "REFUNDED"] as const

export const paymentListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ADMIN_PAYMENT_STATUSES).optional(),
  method: z.enum(ADMIN_PAYMENT_METHODS).optional(),
  escrow: z.enum(ADMIN_ESCROW_STATES).optional(),
  q: searchSchema,
})

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>

// ---------------------------------------------------------------------------
// Commission (AD-06) and payouts (AD-07) — docs/admin-commission-payouts-feature.md
// ---------------------------------------------------------------------------

/**
 * A percent with at most 2 decimals (`Decimal(5, 2)`); form inputs arrive as strings. A blank field
 * is "missing", not 0 — `z.coerce` alone would turn "" into a silent 0% commission.
 */
export const commissionRateSchema = z
  .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.coerce.number({ error: "Enter a percentage." }))
  .pipe(z.number())
  .refine((v) => v >= COMMISSION_MIN, `The rate can't be below ${COMMISSION_MIN}%.`)
  .refine((v) => v <= COMMISSION_MAX, `The rate can't be above ${COMMISSION_MAX}%.`)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimals.")

/** `PATCH /api/admin/commission` (global) and `PUT /api/admin/commission/categories/[id]` (override). */
export const commissionRateBodySchema = z.object({ ratePercent: commissionRateSchema })
export type CommissionRateInput = z.input<typeof commissionRateBodySchema>
export type CommissionRateValues = z.output<typeof commissionRateBodySchema>

export const ADMIN_PAYOUT_STATUSES = ["REQUESTED", "APPROVED", "PAID", "REJECTED"] as const
export const PAYOUT_REFERENCE_MAX = 100

export const payoutListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ADMIN_PAYOUT_STATUSES).optional(),
  q: searchSchema,
})

/** `PATCH /api/admin/payouts/[id]/status`; which `from` each needs lives in `utils/payout-rules.ts`. */
export const payoutStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("APPROVED") }),
  z.object({ status: z.literal("REJECTED"), reason: reasonSchema }),
  z.object({
    status: z.literal("PAID"),
    /** Bank / wallet transfer reference, kept in the ledger note and the audit log. */
    reference: z
      .string()
      .trim()
      .max(PAYOUT_REFERENCE_MAX, `Keep the reference under ${PAYOUT_REFERENCE_MAX} characters.`)
      .optional()
      .transform((v) => v || undefined),
  }),
])
export const markPaidFormSchema = payoutStatusSchema.options[2].omit({ status: true })

export type PayoutListQuery = z.infer<typeof payoutListQuerySchema>
export type PayoutStatusValues = z.infer<typeof payoutStatusSchema>
export type MarkPaidFormInput = z.input<typeof markPaidFormSchema>
export type MarkPaidFormValues = z.output<typeof markPaidFormSchema>

export type RequestListQuery = z.infer<typeof requestListQuerySchema>
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>
export type AdminCancelValues = z.infer<typeof adminCancelStatusSchema>

export type DisputeStatusValues = z.infer<typeof disputeStatusSchema>
export type ResolveDisputeFormInput = z.input<typeof resolveDisputeFormSchema>
export type ResolveDisputeFormValues = z.output<typeof resolveDisputeFormSchema>
export type DisputeListQuery = z.infer<typeof disputeListQuerySchema>
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>
export type ReviewModerationValues = z.infer<typeof reviewModerationSchema>
