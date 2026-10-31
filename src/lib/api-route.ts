import "server-only"
import { NextResponse } from "next/server"
import { z, type ZodType } from "zod"
import { isAppError, ValidationError } from "@/lib/errors"
import { apiFailure, apiSuccess } from "@/types/api"

/**
 * Server-side helpers for Route Handlers in `src/app/api/**`. Every handler
 * follows authorise → validate → delegate and answers with the `ApiResponse`
 * envelope (docs/api-conventions.md).
 */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(apiSuccess(data), init)
}

export function created<T>(data: T) {
  return NextResponse.json(apiSuccess(data), { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

/** Maps a thrown error to a JSON failure. The real cause of unknown errors stays in the server log. */
export function toErrorResponse(error: unknown, fallback: string) {
  if (isAppError(error)) {
    return NextResponse.json(apiFailure(error.message, error.code, error.fieldErrors), {
      status: error.status,
    })
  }
  console.error(`[api] ${fallback}`, error)
  return NextResponse.json(apiFailure(fallback, "INTERNAL"), { status: 500 })
}

function validationError(error: z.ZodError) {
  return new ValidationError(
    "Please check the highlighted fields.",
    z.flattenError(error).fieldErrors as Record<string, string[]>,
  )
}

/** Parses and validates a JSON body. Never trust the client. */
export async function parseBody<S extends ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    throw new ValidationError("Request body must be valid JSON.")
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) throw validationError(parsed.error)
  return parsed.data
}

/** Validates the query string (`?page=2&sort=newest`) against a schema. */
export function parseQuery<S extends ZodType>(request: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = schema.safeParse(params)
  if (!parsed.success) throw validationError(parsed.error)
  return parsed.data
}

/** Validates dynamic route params (`/api/things/[id]`). */
export async function parseParams<S extends ZodType>(
  params: Promise<Record<string, string | string[] | undefined>>,
  schema: S,
): Promise<z.output<S>> {
  const parsed = schema.safeParse(await params)
  if (!parsed.success) throw validationError(parsed.error)
  return parsed.data
}
