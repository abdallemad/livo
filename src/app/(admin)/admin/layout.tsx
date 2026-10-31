import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { getCurrentUser } from "@/services/auth.service"

/**
 * Admin shell — layer 2 of 3. The proxy already 404s non-admins, but Next
 * renders segments in parallel, so the layout re-checks before any output.
 * Dynamic by design (reads the session). Collapsible sidebar + breadcrumb
 * bar + dense content, desktop-first (DESIGN-SYSTEM.md §7).
 */
export const metadata: Metadata = {
  title: { default: "Admin dashboard", template: "%s | Admin dashboard" },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser()
  if (user?.role !== "ADMIN") notFound()

  return (
    <DashboardShell zone="admin" density="dense">
      {children}
    </DashboardShell>
  )
}
