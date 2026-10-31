"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DASHBOARD_NAV, type DashboardZone } from "@/constants/dashboard-nav"
import { isActivePath } from "./DashboardNav"

/** Mobile bottom tab bar for customer/provider shells (docs/DESIGN-SYSTEM.md §7). Hidden from md up. */
export function BottomTabs({ zone }: { zone: DashboardZone }) {
  const items = DASHBOARD_NAV[zone].tabs ?? []
  const pathname = usePathname()
  return (
    <nav aria-label="التنقل الرئيسي" className="shrink-0 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActivePath(pathname, item)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
