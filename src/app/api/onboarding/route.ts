import { ok, toErrorResponse } from "@/lib/api-route"
import { requireUser } from "@/services/auth.service"
import { getOnboardingState } from "@/services/onboarding.service"

/** GET /api/onboarding — the signed-in user's wizard state, derived from the DB (docs/onboarding-feature.md). */
export async function GET() {
  try {
    const user = await requireUser()
    return ok(await getOnboardingState(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Couldn't load the sign-up steps.")
  }
}
