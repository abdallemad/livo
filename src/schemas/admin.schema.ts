import { z } from "zod"
import { paginationQuerySchema } from "./common.schema"

/**
 * Admin decisions and list filters (docs/admin-dashboard-feature.md,
 * docs/admin-providers-users-feature.md). Shared by the admin forms/hooks
 * and the `/api/admin/*` routes.
 */
export const REASON_MIN = 10
export const REASON_MAX = 500

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

/** AD-05: the only transition the dashboard offers is OPEN → UNDER_REVIEW; resolving lives on the dispute page. */
export const disputeStatusSchema = z.object({ status: z.literal("UNDER_REVIEW") })

/** Query-string text search: trimmed, empty → undefined. */
const searchSchema = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => v || undefined)

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
export type DisputeStatusValues = z.infer<typeof disputeStatusSchema>
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
