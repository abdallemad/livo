import { z } from "zod"
import { CATALOG_SORTS, DURATION_FILTERS, MAX_CATALOG_PAGE } from "@/utils/catalog"

/**
 * `/services` filters (MK-02, MK-06; docs/catalog-feature.md). The same schema parses the URL in the
 * browser (`useUrlQuery`) and the query of the public `GET /api/services`.
 */

/** "" and missing both mean "no value" — `z.coerce` alone would turn "" into 0. */
const optionalNumber = (schema: z.ZodNumber) => z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().pipe(schema).optional())

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,80}$/)
  .optional()
  .or(z.literal("").transform(() => undefined))

export const catalogQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || undefined),
  category: slug,
  area: slug,
  minPrice: optionalNumber(z.number().min(0).max(100_000)),
  maxPrice: optionalNumber(z.number().min(0).max(100_000)),
  maxDuration: optionalNumber(z.number().int().refine((v) => (DURATION_FILTERS as readonly number[]).includes(v))),
  minRating: optionalNumber(z.number().min(1).max(5)),
  sort: z.enum(CATALOG_SORTS).default("recommended"),
  page: z.coerce.number().int().min(1).max(MAX_CATALOG_PAGE).default(1),
})
export type CatalogQuery = z.output<typeof catalogQuerySchema>
