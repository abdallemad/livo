/**
 * The JSON envelope every `src/app/api/**` Route Handler returns, and the
 * shape `src/lib/api-client.ts` unwraps in the browser. Never return raw
 * Prisma rows or thrown errors — always one of these (docs/api-conventions.md).
 */
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  error: string
  code: string
  fieldErrors?: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export const apiSuccess = <T,>(data: T): ApiSuccess<T> => ({ success: true, data })

export const apiFailure = (
  error: string,
  code: string,
  fieldErrors?: Record<string, string[]>,
): ApiFailure => ({ success: false, error, code, ...(fieldErrors ? { fieldErrors } : {}) })

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  pageCount: number
}
