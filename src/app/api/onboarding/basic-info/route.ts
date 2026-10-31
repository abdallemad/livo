import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { basicInfoStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { saveBasicInfo } from "@/services/onboarding.service"

/** PUT /api/onboarding/basic-info — step 2: name, email, city, area. */
export async function PUT(request: Request) {
  try {
    const user = await requireUser() // 1. authorise — the user id comes from the session only
    const values = await parseBody(request, basicInfoStepSchema) // 2. validate
    return ok(await saveBasicInfo(user.id, values)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "Couldn't save your details.")
  }
}
