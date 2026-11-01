import { z } from "zod"
import { paginationQuerySchema } from "./common.schema"

/**
 * Provider workspace queries (docs/provider-dashboard-requests-feature.md). Shared by the
 * `/provider/requests` client island (URL filters) and `GET /api/provider/requests`.
 */

export const PROVIDER_REQUEST_TABS = ["new", "quoted"] as const
export const PROVIDER_REQUEST_SCOPES = ["areas", "city"] as const
export const PROVIDER_REQUEST_SORTS = ["newest", "expiring", "budget"] as const

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined)

export const providerRequestListQuerySchema = paginationQuerySchema.extend({
  /** `new` = matching requests I haven't quoted; `quoted` = requests I sent a quote on. */
  tab: z.enum(PROVIDER_REQUEST_TABS).default("new"),
  /** `areas` = my work areas (default); `city` = anywhere in my city. Only for the `new` tab. */
  scope: z.enum(PROVIDER_REQUEST_SCOPES).default("areas"),
  sort: z.enum(PROVIDER_REQUEST_SORTS).default("newest"),
  categoryId: optionalText(64),
  q: optionalText(100),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})

export type ProviderRequestListQuery = z.infer<typeof providerRequestListQuerySchema>
export type ProviderRequestTab = (typeof PROVIDER_REQUEST_TABS)[number]
export type ProviderRequestSort = (typeof PROVIDER_REQUEST_SORTS)[number]

// ---------------------------------------------------------------------------
// Quotes (`/provider/quotes`, PR-07) and bookings (`/provider/bookings`, PR-08)
// docs/provider-quotes-bookings-feature.md
// ---------------------------------------------------------------------------

export const PROVIDER_QUOTE_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"] as const

export const providerQuoteListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PROVIDER_QUOTE_STATUSES).optional(),
  q: optionalText(100),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})

/** `PATCH /api/provider/quotes/[id]/status` — the only change a provider makes from the list. */
export const providerQuoteStatusSchema = z.object({ status: z.literal("WITHDRAWN") })

export const PROVIDER_BOOKING_TAB_IDS = ["current", "finished", "cancelled"] as const

export const providerBookingListQuerySchema = paginationQuerySchema.extend({
  tab: z.enum(PROVIDER_BOOKING_TAB_IDS).default("current"),
  q: optionalText(100),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})

export const DECLINE_REASON_MIN = 10
export const DECLINE_REASON_MAX = 500

/** `PATCH /api/provider/bookings/[id]/status`; rules in `utils/provider-booking.ts`. */
export const providerBookingStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("CONFIRMED") }),
  z.object({
    status: z.literal("REJECTED"),
    reason: z
      .string()
      .trim()
      .min(DECLINE_REASON_MIN, `Tell the customer why in at least ${DECLINE_REASON_MIN} characters.`)
      .max(DECLINE_REASON_MAX, `Keep it under ${DECLINE_REASON_MAX} characters.`),
  }),
  z.object({ status: z.literal("IN_PROGRESS") }),
  z.object({ status: z.literal("AWAITING_CONFIRMATION") }),
])
export const declineFormSchema = providerBookingStatusSchema.options[1].omit({ status: true })

export type ProviderQuoteListQuery = z.infer<typeof providerQuoteListQuerySchema>
export type ProviderBookingListQuery = z.infer<typeof providerBookingListQuerySchema>
export type ProviderBookingStatusValues = z.infer<typeof providerBookingStatusSchema>
export type DeclineFormValues = z.infer<typeof declineFormSchema>
