import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  FileText,
  Home,
  Images,
  Inbox,
  Landmark,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react"
import type { NavGroup, NavItem } from "@/types/nav"

/** Provider sidebar (`/provider/*`, docs/SITEMAP.md §4). */
export const PROVIDER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/provider", label: "Home", icon: Home, exact: true },
      { href: "/provider/requests", label: "Available requests", icon: Inbox },
      { href: "/provider/quotes", label: "Quotes", icon: FileText },
      { href: "/provider/bookings", label: "My bookings", icon: CalendarCheck },
      { href: "/provider/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    label: "My work",
    items: [
      { href: "/provider/services", label: "My services", icon: BriefcaseBusiness },
      { href: "/provider/portfolio", label: "Portfolio", icon: Images },
      { href: "/provider/schedule", label: "Schedule", icon: CalendarDays },
      { href: "/provider/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/provider/earnings", label: "Earnings", icon: Wallet },
      { href: "/provider/payouts", label: "Payouts", icon: Landmark },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/provider/verification", label: "Verification", icon: ShieldCheck },
      { href: "/provider/notifications", label: "Notifications", icon: Bell },
      { href: "/provider/settings", label: "Settings", icon: Settings },
    ],
  },
]

/** Mobile bottom tab bar (§7): Home, requests, my bookings, messages, earnings. */
export const PROVIDER_TABS: NavItem[] = [
  { href: "/provider", label: "Home", icon: Home, exact: true },
  { href: "/provider/requests", label: "Requests", icon: Inbox },
  { href: "/provider/bookings", label: "My bookings", icon: CalendarCheck },
  { href: "/provider/messages", label: "Messages", icon: MessageSquare },
  { href: "/provider/earnings", label: "Earnings", icon: Wallet },
]
