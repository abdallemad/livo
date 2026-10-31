import { ok } from "@/lib/api-route"

/** GET /api/health — liveness probe for the VPS / Docker health check. No DB access. */
export function GET() {
  return ok({ status: "ok" })
}
