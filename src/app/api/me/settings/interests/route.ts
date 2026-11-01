import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { interestsSettingsSchema } from "@/schemas/customer-account.schema"
import { requireUser } from "@/services/auth.service"
import { saveInterests } from "@/services/customer-account.service"

/** PUT /api/me/settings/interests `{ categoryIds }` — the services the customer cares about (onboarding step 4). */
export async function PUT(request: Request) {
  try {
    const user = await requireUser()
    const input = await parseBody(request, interestsSettingsSchema)
    return ok(await saveInterests(user.id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not save your interests.")
  }
}
