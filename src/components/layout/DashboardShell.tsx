import Image from "next/image"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { SITE_LOGO, SITE_NAME } from "@/constants/site"
import { DASHBOARD_NAV, type DashboardZone } from "@/constants/dashboard-nav"
import { AccountControls } from "./AccountControls"
import { BottomTabs } from "./BottomTabs"
import { DashboardBreadcrumb } from "./DashboardBreadcrumb"
import { DashboardNav } from "./DashboardNav"
import { ThemeToggle } from "./ThemeToggle"

interface DashboardShellProps {
  /** Picks root, label, sidebar nav and (customer/provider) mobile bottom tabs from `DASHBOARD_NAV`. */
  zone: DashboardZone
  /** `touch` for customer/provider (44px rows), `dense` for admin. */
  density?: "touch" | "dense"
  /** Pinned under the top bar, e.g. the provider verification banner. */
  banner?: React.ReactNode
  children: React.ReactNode
}

/**
 * Sidebar shell for `/account`, `/provider` and `/admin` (docs/DESIGN-SYSTEM.md §7).
 * `h-dvh overflow-hidden`; only the content column scrolls. Sidebar sits at the
 * inline START (left in LTR); on mobile it becomes a sheet and the bottom tab
 * bar carries the main destinations. Static: reads nothing from the request —
 * active state, breadcrumb and account controls are client islands.
 */
export function DashboardShell({ zone, density = "touch", banner, children }: DashboardShellProps) {
  const { root: rootHref, label: zoneLabel, tabs } = DASHBOARD_NAV[zone]
  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
      <Sidebar side="left" collapsible={density === "dense" ? "icon" : "offcanvas"}>
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href={rootHref} className="flex h-10 items-center gap-2 px-1 font-heading font-semibold">
            <Image src={SITE_LOGO} alt="" width={28} height={28} />
            <span className="group-data-[collapsible=icon]:hidden">{SITE_NAME}</span>
            <span className="text-sm font-normal text-muted-foreground group-data-[collapsible=icon]:hidden">
              {zoneLabel}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav zone={zone} size={density === "dense" ? "default" : "touch"} />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
          <Link href="/" className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
            Main site
          </Link>
        </SidebarFooter>
        {density === "dense" ? <SidebarRail /> : null}
      </Sidebar>

      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 md:px-4">
          <SidebarTrigger className={tabs ? "max-md:hidden" : undefined} />
          {tabs ? (
            <Link href={rootHref} className="flex items-center gap-2 font-heading font-semibold md:hidden">
              <Image src={SITE_LOGO} alt="" width={24} height={24} />
              {SITE_NAME}
            </Link>
          ) : null}
          <div className="hidden min-w-0 md:block">
            <DashboardBreadcrumb zone={zone} />
          </div>
          <div className="ms-auto flex items-center gap-1">
            {tabs ? <SidebarTrigger className="md:hidden" /> : null}
            <ThemeToggle />
            <AccountControls />
          </div>
        </header>
        {banner}
        <div className="flex-1 overflow-y-auto">
          <div className={density === "dense" ? "p-4 md:p-6" : "mx-auto max-w-5xl p-4 md:p-6"}>{children}</div>
        </div>
        {tabs ? <BottomTabs zone={zone} /> : null}
      </SidebarInset>
    </SidebarProvider>
  )
}
