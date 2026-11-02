import { z } from "zod"
import { ADDRESS_LABEL_MAX } from "@/utils/address-book"
import { CUSTOMER_CANCEL_REASON_MAX } from "@/utils/customer-booking-actions"
import { paginationQuerySchema } from "./common.schema"
import { addressStepSchema, interestsStepSchema } from "./onboarding.schema"

/**
 * Customer settings, addresses, bookings and payments (AU-06, CU-13, CU-14, SY-07) —
 * docs/customer-account-feature.md. Field rules are shared with the onboarding steps they edit.
 */

export { personalSettingsSchema, type PersonalSettingsInput, type PersonalSettingsValues } from "./provider-account.schema"

/** `PUT /api/me/settings/interests` — onboarding step 4. */
export const interestsSettingsSchema = interestsStepSchema
export type InterestsSettingsValues = z.infer<typeof interestsSettingsSchema>

/** `POST /api/me/addresses`, `PUT /api/me/addresses/[id]` — onboarding's address step plus a label and "make default". */
export const addressSchema = addressStepSchema.extend({
  label: z
    .string()
    .trim()
    .max(ADDRESS_LABEL_MAX, `Keep the name under ${ADDRESS_LABEL_MAX} characters.`)
    .optional()
    .transform((v) => v || null),
  isDefault: z.boolean().default(false),
})
export type AddressInput = z.input<typeof addressSchema>
export type AddressValues = z.output<typeof addressSchema>

export const CUSTOMER_BOOKING_TAB_IDS = ["current", "finished", "cancelled"] as const

export const customerBookingListQuerySchema = paginationQuerySchema.extend({
  tab: z.enum(CUSTOMER_BOOKING_TAB_IDS).default("current"),
  q: z.string().trim().max(100).optional().transform((v) => v || undefined),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})
export type CustomerBookingListQuery = z.infer<typeof customerBookingListQuerySchema>

export const customerPaymentQuerySchema = paginationQuerySchema.extend({
  view: z.enum(["payments", "invoices"]).default("payments"),
  perPage: z.coerce.number().int().min(1).max(50).default(15),
})
export type CustomerPaymentQuery = z.infer<typeof customerPaymentQuerySchema>

/**
 * `PATCH /api/me/bookings/[id]/status` (docs/customer-booking-detail-feature.md): confirm the job is done (CU-09), or
 * cancel before the provider accepts (CU-11) with an optional reason the provider sees.
 */
export const customerBookingStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("COMPLETED") }),
  z.object({
    status: z.literal("CANCELLED"),
    reason: z
      .string()
      .trim()
      .max(CUSTOMER_CANCEL_REASON_MAX, `Keep it under ${CUSTOMER_CANCEL_REASON_MAX} characters.`)
      .optional()
      .transform((v) => v || undefined),
  }),
])
export type CustomerBookingStatusValues = z.output<typeof customerBookingStatusSchema>
