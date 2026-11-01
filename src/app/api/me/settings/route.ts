import { ok, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { requireUser } from "@/services/auth.service"
import { getCustomerSettings } from "@/services/customer-account.service"

/** GET /api/me/settings — personal details, interests and their options (AU-06). */
export async function GET() {
  try {
    const user = await requireUser()
    const data = await getCustomerSettings(user.id)
    if (!data) throw new NotFoundError("Account not found.")
    return ok(data, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your settings.")
  }
}
