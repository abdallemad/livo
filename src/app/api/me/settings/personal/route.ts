import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { personalSettingsSchema } from "@/schemas/customer-account.schema"
import { savePersonalDetails } from "@/services/account-settings.service"
import { requireUser } from "@/services/auth.service"

/** PUT /api/me/settings/personal `{ name, email }` — name mirrored to Clerk, photo URL copied from Clerk (AU-06). */
export async function PUT(request: Request) {
  try {
    const user = await requireUser()
    const input = await parseBody(request, personalSettingsSchema)
    return ok(await savePersonalDetails(user.id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not save your details.")
  }
}
