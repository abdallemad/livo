import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { providerProfileStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { saveProviderProfile } from "@/services/onboarding.service"

/** PUT /api/onboarding/provider-profile — provider step 3 (PR-01). */
export async function PUT(request: Request) {
  try {
    const user = await requireUser() // 1. authorise — the user id comes from the session only
    const values = await parseBody(request, providerProfileStepSchema) // 2. validate
    return ok(await saveProviderProfile(user.id, values)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "Couldn't save your professional profile.")
  }
}
