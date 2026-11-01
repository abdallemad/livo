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
