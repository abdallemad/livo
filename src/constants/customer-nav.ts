import {
  Bell,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Home,
  MapPin,
  MessageSquare,
  Settings,
  UserRound,
} from "lucide-react"
import type { NavGroup, NavItem } from "@/types/nav"

/** Customer sidebar (`/account/*`, docs/SITEMAP.md §3). Add a page here when you add the route. */
export const CUSTOMER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/account", label: "Home", icon: Home, exact: true },
      { href: "/account/requests", label: "My requests", icon: ClipboardList },
      { href: "/account/bookings", label: "My bookings", icon: CalendarCheck },
      { href: "/account/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    label: "My account",
    items: [
      { href: "/account/payments", label: "Payments and invoices", icon: CreditCard },
      { href: "/account/addresses", label: "Addresses", icon: MapPin },
      { href: "/account/notifications", label: "Notifications", icon: Bell },
      { href: "/account/settings", label: "Settings", icon: Settings },
    ],
  },
]

/** Mobile bottom tab bar (§7): Home, my requests, my bookings, messages, my account. */
export const CUSTOMER_TABS: NavItem[] = [
  { href: "/account", label: "Home", icon: Home, exact: true },
  { href: "/account/requests", label: "My requests", icon: ClipboardList },
  { href: "/account/bookings", label: "My bookings", icon: CalendarCheck },
  { href: "/account/messages", label: "Messages", icon: MessageSquare },
  { href: "/account/settings", label: "My account", icon: UserRound },
]
