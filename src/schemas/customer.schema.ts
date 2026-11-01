import { z } from "zod"
import { paginationQuerySchema } from "./common.schema"

/** Customer dashboard & requests (CU-08, CU-11, CU-13) — docs/customer-dashboard-requests-feature.md. */

export const CUSTOMER_REQUEST_TAB_IDS = ["active", "booked", "closed"] as const

export const customerRequestListQuerySchema = paginationQuerySchema.extend({
  tab: z.enum(CUSTOMER_REQUEST_TAB_IDS).default("active"),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})
export type CustomerRequestListQuery = z.infer<typeof customerRequestListQuerySchema>

/** `PATCH /api/me/requests/[id]/status` — the only change the list makes (CU-11). */
export const customerRequestStatusSchema = z.object({ status: z.literal("CANCELLED") })
