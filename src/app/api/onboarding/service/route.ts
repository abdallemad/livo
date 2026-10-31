import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { firstServiceStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { saveFirstService } from "@/services/onboarding.service"

/** PUT /api/onboarding/service — provider step 5 (PR-05): create or update the first service. */
export async function PUT(request: Request) {
  try {
    const user = await requireUser() // 1. authorise — the user id comes from the session only
    const values = await parseBody(request, firstServiceStepSchema) // 2. validate
    return ok(await saveFirstService(user.id, values)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "تعذّر حفظ الخدمة.")
  }
}
