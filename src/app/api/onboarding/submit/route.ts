import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { submitStepSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { submitProvider } from "@/services/onboarding.service"

/**
 * POST /api/onboarding/submit — provider step 6: DRAFT → PENDING. The body
 * only carries the terms acceptance; the status change is decided by the
 * service. No revalidateStorefront(): nothing becomes public until an admin approves.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    await parseBody(request, submitStepSchema)
    return ok(await submitProvider(user.id))
  } catch (error) {
    return toErrorResponse(error, "تعذّر إرسال ملفك للمراجعة.")
  }
}
