"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { DASHBOARD_NAV, type DashboardZone } from "@/constants/dashboard-nav"
import type { NavItem } from "@/types/nav"
import { useUnreadMessages } from "@/hooks/use-chat"

/** Layouts don't re-render on navigation, so the active state lives in this client island. */
export function isActivePath(pathname: string, item: Pick<NavItem, "href" | "exact">) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

interface DashboardNavProps {
  zone: DashboardZone
  /** `touch` = 44px rows (customer/provider), `default` = dense (admin). */
  size?: "default" | "touch"
}

/** Which chat side a zone's **Messages** item counts for (admins have no chat). */
export const chatSideOf = (zone: DashboardZone) => (zone === "account" ? "CUSTOMER" : zone === "provider" ? "PROVIDER" : null)
export const isMessagesItem = (href: string) => href.endsWith("/messages")
/** "9+" keeps the badge narrow. */
export const badgeText = (n: number) => (n > 9 ? "9+" : String(n))

export function DashboardNav({ zone, size = "default" }: DashboardNavProps) {
  const groups = DASHBOARD_NAV[zone].nav
  const unread = useUnreadMessages(chatSideOf(zone)).data?.total ?? 0
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
                      {isMessagesItem(item.href) && unread > 0 ? <span className="sr-only">, {unread} unread</span> : null}
                    </SidebarMenuButton>
                    {isMessagesItem(item.href) && unread > 0 ? (
                      <SidebarMenuBadge aria-hidden className="bg-primary text-primary-foreground">
                        {badgeText(unread)}
                      </SidebarMenuBadge>
                    ) : null}
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
