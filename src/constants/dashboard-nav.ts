import type { NavGroup, NavItem } from "@/types/nav"
import { ADMIN_NAV } from "./admin-nav"
import { CUSTOMER_NAV, CUSTOMER_TABS } from "./customer-nav"
import { PROVIDER_NAV, PROVIDER_TABS } from "./provider-nav"

/**
 * Nav registry keyed by zone. Nav items hold icon *components*, which can't be
 * passed from a Server Component (the shell) to client islands as props — so
 * the shell passes the zone key and each island looks its nav up here.
 */
export type DashboardZone = "account" | "provider" | "admin"

export const DASHBOARD_NAV: Record<DashboardZone, { root: string; label: string; nav: NavGroup[]; tabs?: NavItem[] }> = {
  account: { root: "/account", label: "My account", nav: CUSTOMER_NAV, tabs: CUSTOMER_TABS },
  provider: { root: "/provider", label: "Provider dashboard", nav: PROVIDER_NAV, tabs: PROVIDER_TABS },
  admin: { root: "/admin", label: "Admin", nav: ADMIN_NAV },
}
