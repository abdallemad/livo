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
      { href: "/account", label: "الرئيسية", icon: Home, exact: true },
      { href: "/account/requests", label: "طلباتي", icon: ClipboardList },
      { href: "/account/bookings", label: "حجوزاتي", icon: CalendarCheck },
      { href: "/account/messages", label: "المحادثات", icon: MessageSquare },
    ],
  },
  {
    label: "حسابي",
    items: [
      { href: "/account/payments", label: "المدفوعات والفواتير", icon: CreditCard },
      { href: "/account/addresses", label: "العناوين", icon: MapPin },
      { href: "/account/notifications", label: "الإشعارات", icon: Bell },
      { href: "/account/settings", label: "الإعدادات", icon: Settings },
    ],
  },
]

/** Mobile bottom tab bar (§7): الرئيسية، طلباتي، حجوزاتي، المحادثات، حسابي. */
export const CUSTOMER_TABS: NavItem[] = [
  { href: "/account", label: "الرئيسية", icon: Home, exact: true },
  { href: "/account/requests", label: "طلباتي", icon: ClipboardList },
  { href: "/account/bookings", label: "حجوزاتي", icon: CalendarCheck },
  { href: "/account/messages", label: "المحادثات", icon: MessageSquare },
  { href: "/account/settings", label: "حسابي", icon: UserRound },
]
