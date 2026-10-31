import { ok, toErrorResponse } from "@/lib/api-route"
import { getViewer } from "@/services/auth.service"

/** GET /api/me — the signed-in viewer's role, or `null` when signed out. */
export async function GET() {
  try {
    return ok(await getViewer(), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your profile.")
  }
}
