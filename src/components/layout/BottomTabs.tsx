"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DASHBOARD_NAV, type DashboardZone } from "@/constants/dashboard-nav"
import { useUnreadMessages } from "@/hooks/use-chat"
import { badgeText, chatSideOf, isActivePath, isMessagesItem } from "./DashboardNav"

/** Mobile bottom tab bar for customer/provider shells (docs/DESIGN-SYSTEM.md §7). Hidden from md up. */
export function BottomTabs({ zone }: { zone: DashboardZone }) {
  const items = DASHBOARD_NAV[zone].tabs ?? []
  const pathname = usePathname()
  const unread = useUnreadMessages(chatSideOf(zone)).data?.total ?? 0
  return (
    <nav aria-label="Main navigation" className="shrink-0 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
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
                <span className="relative">
                  <Icon className="size-6" aria-hidden />
                  {isMessagesItem(item.href) && unread > 0 ? (
                    <span className="absolute -end-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums">
                      {badgeText(unread)}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">
                  {item.label}
                  {isMessagesItem(item.href) && unread > 0 ? <span className="sr-only">, {unread} unread</span> : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
