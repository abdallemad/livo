import "server-only"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getGateById } from "@/services/auth.service"
import { getZoneRedirect, type PrivateZone } from "@/utils/zone-access"

/**
 * Layer 2 of the zone gate (layer 1 is `src/proxy.ts`, layer 3 the `require*`
 * guard in every API route). Next renders segments in parallel, so the
 * layout re-checks before any output ships. Makes the zone dynamic — fine,
 * every private page is `noindex` anyway.
 */
export async function requireZone(zone: PrivateZone): Promise<void> {
  const { userId } = await auth()
  const gate = userId ? await getGateById(userId) : null
  const target = getZoneRedirect(zone, {
    signedIn: !!userId,
    role: gate?.role ?? null,
    onboardingCompleted: gate?.onboardingCompleted ?? false,
    suspended: gate?.suspended ?? false,
  })
  if (target) redirect(target)
}
