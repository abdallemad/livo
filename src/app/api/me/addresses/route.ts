import { created, ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { addressSchema } from "@/schemas/customer-account.schema"
import { requireUser } from "@/services/auth.service"
import { createAddress, getAddresses } from "@/services/customer-account.service"

/** GET /api/me/addresses — saved addresses + the city's areas. POST — add one (CU-14, max 10). */
export async function GET() {
  try {
    const user = await requireUser()
    return ok(await getAddresses(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your addresses.")
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const input = await parseBody(request, addressSchema)
    return created(await createAddress(user.id, input))
  } catch (error) {
    return toErrorResponse(error, "Could not save the address.")
  }
}
