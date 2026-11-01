import { ok, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { requireProvider } from "@/services/auth.service"
import { getSettings } from "@/services/provider-settings.service"

/** GET /api/provider/settings — personal details, work profile and their options (AU-06). */
export async function GET() {
  try {
    const user = await requireProvider()
    const data = await getSettings(user.id)
    if (!data) throw new NotFoundError("This account has no provider profile.")
    return ok(data, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your settings.")
  }
}
