import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { VerificationBanner } from "@/components/provider/VerificationBanner"
import { requireZone } from "@/lib/zone-guard"
import { getBannerStatus } from "@/services/provider-verification.service"

/**
 * Provider shell for `/provider/*` (docs/SITEMAP.md §4, DESIGN-SYSTEM.md §7).
 * Same structure as the customer shell, bigger targets, and the verification
 * banner pinned at the top until the provider is ACTIVE.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  await requireZone("provider")
  // The real status (docs/provider-verification-settings-feature.md): nothing when ACTIVE, nothing for an
  // admin browsing the zone (no provider profile). The zone is already dynamic (`requireZone` reads the session).
  const { userId } = await auth()
  const status = userId ? await getBannerStatus(userId) : null
  return (
    <DashboardShell zone="provider" banner={status ? <VerificationBanner status={status} /> : null}>
      {children}
    </DashboardShell>
  )
}
