import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { userListQuerySchema } from "@/schemas/admin.schema"
import { listUsers } from "@/services/admin-user.service"
import { requireAdmin } from "@/services/auth.service"

/** GET /api/admin/users?q=&role=&status=&page= — every account, searchable (AD-03). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const query = parseQuery(request, userListQuerySchema)
    return ok(await listUsers(query), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load users.")
  }
}
