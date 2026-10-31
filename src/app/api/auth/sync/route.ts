import { auth } from "@clerk/nextjs/server"
import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { UnauthorizedError } from "@/lib/errors"
import { syncUserSchema } from "@/schemas/user.schema"
import { syncUserWithDatabase } from "@/services/auth.service"

/**
 * POST /api/auth/sync — called once from `/auth-callback` after sign-in/up to
 * create the DB row for the Clerk user. Idempotent.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth() // 1. authorise
    if (!userId) throw new UnauthorizedError()
    const { role } = await parseBody(request, syncUserSchema) // 2. validate
    return ok(await syncUserWithDatabase(role)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "Could not finish setting up your account.")
  }
}
