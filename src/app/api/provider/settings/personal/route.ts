import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { personalSettingsSchema } from "@/schemas/provider-account.schema"
import { requireProvider } from "@/services/auth.service"
import { savePersonal } from "@/services/provider-settings.service"

/** PUT /api/provider/settings/personal — name and email (name mirrored to Clerk) (AU-06). Shown on the public profile, so it busts the storefront cache. */
export async function PUT(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, personalSettingsSchema)
    const result = await savePersonal(user.id, input)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save your settings.")
  }
}
