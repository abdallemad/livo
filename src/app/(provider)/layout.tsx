import type { Metadata } from "next"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { VerificationBanner } from "@/components/provider/VerificationBanner"
import { requireZone } from "@/lib/zone-guard"

/**
 * Provider shell for `/provider/*` (docs/SITEMAP.md §4, DESIGN-SYSTEM.md §7).
 * Same structure as the customer shell, bigger targets, and the verification
 * banner pinned at the top until the provider is ACTIVE.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  await requireZone("provider")
  // TODO(provider verification): read the real status from the provider profile; hide the banner when ACTIVE.
  return (
    <DashboardShell zone="provider" banner={<VerificationBanner status="PENDING" />}>
      {children}
    </DashboardShell>
  )
}
