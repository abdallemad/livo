import type { Metadata } from "next"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { requireZone } from "@/lib/zone-guard"

/**
 * Customer shell for `/account/*` (docs/SITEMAP.md §3, DESIGN-SYSTEM.md §7).
 * Layer 2 of the zone gate (the proxy is layer 1). Dynamic by design —
 * every page under it is private and `noindex`.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await requireZone("account")
  return (
    <DashboardShell zone="account">
      {children}
    </DashboardShell>
  )
}
