import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { addressStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { saveAddress } from "@/services/onboarding.service"

/** PUT /api/onboarding/address — customer step 3 (optional): the default address. */
export async function PUT(request: Request) {
  try {
    const user = await requireUser() // 1. authorise — the user id comes from the session only
    const values = await parseBody(request, addressStepSchema) // 2. validate
    return ok(await saveAddress(user.id, values)) // 3. delegate
  } catch (error) {
    return toErrorResponse(error, "تعذّر حفظ العنوان.")
  }
}
