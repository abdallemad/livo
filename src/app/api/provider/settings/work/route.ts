import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { workSettingsSchema } from "@/schemas/provider-account.schema"
import { requireProvider } from "@/services/auth.service"
import { saveWork } from "@/services/provider-settings.service"

/** PUT /api/provider/settings/work — bio, experience, specialties, work areas (AU-06). Shown on the public profile, so it busts the storefront cache. */
export async function PUT(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, workSettingsSchema)
    const result = await saveWork(user.id, input)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save your settings.")
  }
}
