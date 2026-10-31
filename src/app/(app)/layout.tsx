import { AppHeader } from "@/components/layout/AppHeader"

/**
 * Customer / provider shell (dashboards, catalog, detail pages). Reads
 * nothing from the request; per-visitor UI lives in client islands.
 * Swap the header for an `AppSidebar` once dashboard routes land.
 */
export const revalidate = 3600

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
