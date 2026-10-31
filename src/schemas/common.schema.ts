import { z } from "zod"

/**
 * Building blocks reused by feature schemas. Query-string values arrive as
 * strings, hence `z.coerce` for numbers.
 */
export const MAX_PER_PAGE = 100

export const idParamSchema = z.object({ id: z.string().min(1) })

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(MAX_PER_PAGE).default(20),
})

export type IdParam = z.infer<typeof idParamSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
