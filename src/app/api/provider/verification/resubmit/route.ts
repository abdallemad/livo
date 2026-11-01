import { ok, toErrorResponse } from "@/lib/api-route"
import { requireProvider } from "@/services/auth.service"
import { resubmitVerification } from "@/services/provider-verification.service"

/** POST /api/provider/verification/resubmit — REJECTED → PENDING once the documents are fixed (PR-03). */
export async function POST() {
  try {
    const user = await requireProvider()
    return ok(await resubmitVerification(user.id))
  } catch (error) {
    return toErrorResponse(error, "Couldn't send your application.")
  }
}
