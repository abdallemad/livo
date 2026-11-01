import { ok, toErrorResponse } from "@/lib/api-route"
import { NotFoundError } from "@/lib/errors"
import { requireProvider } from "@/services/auth.service"
import { getVerification } from "@/services/provider-verification.service"

/** GET /api/provider/verification — status, reason, documents, what may change, history (PR-02, PR-03). */
export async function GET() {
  try {
    const user = await requireProvider()
    const data = await getVerification(user.id)
    if (!data) throw new NotFoundError("This account has no provider profile.")
    return ok(data, { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your verification.")
  }
}
