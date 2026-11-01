import { created, ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { serviceFormSchema } from "@/schemas/provider-catalog.schema"
import { requireProvider } from "@/services/auth.service"
import { createService, listServicesForProvider } from "@/services/provider-catalog.service"

/**
 * GET  /api/provider/services — the signed-in provider's fixed-price services with visibility (PR-05).
 * POST /api/provider/services — add one (same rules as onboarding step 5). Busts the public catalog cache.
 */
export async function GET() {
  try {
    const user = await requireProvider()
    return ok(await listServicesForProvider(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your services.")
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, serviceFormSchema)
    const service = await createService(user.id, input)
    revalidateStorefront()
    return created(service)
  } catch (error) {
    return toErrorResponse(error, "Could not add the service.")
  }
}
