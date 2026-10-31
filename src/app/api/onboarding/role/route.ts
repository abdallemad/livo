import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { roleStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { saveRole } from "@/services/onboarding.service"

/** PUT /api/onboarding/role — step 1 (AU-03). CUSTOMER or PROVIDER only; ADMIN can't pass the schema. */
export async function PUT(request: Request) {
  try {
    const user = await requireUser() // 1. authorise — the user id comes from the session only
    const values = await parseBody(request, roleStepSchema) // 2. validate
    return ok(await saveRole(user.id, values)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "Couldn't save the account type.")
  }
}
