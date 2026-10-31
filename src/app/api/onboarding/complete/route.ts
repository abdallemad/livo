import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { interestsStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { finishCustomer } from "@/services/onboarding.service"

/** POST /api/onboarding/complete — customer final step: interests (may be empty) + mark onboarding complete. */
export async function POST(request: Request) {
  try {
    const user = await requireUser() // 1. authorise — the user id comes from the session only
    const values = await parseBody(request, interestsStepSchema) // 2. validate
    return ok(await finishCustomer(user.id, values)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "تعذّر إنهاء التسجيل.")
  }
}
