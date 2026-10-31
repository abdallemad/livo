"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { DASHBOARD_NAV, type DashboardZone } from "@/constants/dashboard-nav"
import type { NavItem } from "@/types/nav"

/** Layouts don't re-render on navigation, so the active state lives in this client island. */
export function isActivePath(pathname: string, item: Pick<NavItem, "href" | "exact">) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

interface DashboardNavProps {
  zone: DashboardZone
  /** `touch` = 44px rows (customer/provider), `default` = dense (admin). */
  size?: "default" | "touch"
}

export function DashboardNav({ zone, size = "default" }: DashboardNavProps) {
  const groups = DASHBOARD_NAV[zone].nav
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <>
      {groups.map((group, gi) => (
        <SidebarGroup key={group.label ?? gi}>
          {group.label ? <SidebarGroupLabel className="text-sm">{group.label}</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isActivePath(pathname, item)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      size={size}
                      isActive={active}
                      tooltip={item.label}
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => isMobile && setOpenMobile(false)}
                        />
                      }
                      className={cn(active && "text-sidebar-primary")}
                    >
                      <Icon aria-hidden />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
