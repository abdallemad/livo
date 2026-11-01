import { ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { scheduleSchema } from "@/schemas/provider-schedule.schema"
import { requireProvider } from "@/services/auth.service"
import { getSchedule, saveSchedule } from "@/services/provider-schedule.service"

/**
 * GET /api/provider/schedule — weekly hours + the next 14 days of bookings (PR-10).
 * PUT /api/provider/schedule `{ days: [{ weekday, ranges: [{ start, end }] }] }` — replace the week.
 */
export async function GET() {
  try {
    const user = await requireProvider()
    return ok(await getSchedule(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your schedule.")
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, scheduleSchema)
    const result = await saveSchedule(user.id, input)
    revalidateStorefront() // working hours belong on the public profile and the booking flow
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save your hours.")
  }
}
