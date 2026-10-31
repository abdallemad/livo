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
      { href: "/provider", label: "الرئيسية", icon: Home, exact: true },
      { href: "/provider/requests", label: "الطلبات المتاحة", icon: Inbox },
      { href: "/provider/quotes", label: "عروض الأسعار", icon: FileText },
      { href: "/provider/bookings", label: "حجوزاتي", icon: CalendarCheck },
      { href: "/provider/messages", label: "المحادثات", icon: MessageSquare },
    ],
  },
  {
    label: "شغلي",
    items: [
      { href: "/provider/services", label: "خدماتي", icon: BriefcaseBusiness },
      { href: "/provider/portfolio", label: "معرض الأعمال", icon: Images },
      { href: "/provider/schedule", label: "المواعيد", icon: CalendarDays },
      { href: "/provider/reviews", label: "التقييمات", icon: Star },
    ],
  },
  {
    label: "الفلوس",
    items: [
      { href: "/provider/earnings", label: "الأرباح", icon: Wallet },
      { href: "/provider/payouts", label: "سحب الأرباح", icon: Landmark },
    ],
  },
  {
    label: "الحساب",
    items: [
      { href: "/provider/verification", label: "التوثيق", icon: ShieldCheck },
      { href: "/provider/notifications", label: "الإشعارات", icon: Bell },
      { href: "/provider/settings", label: "الإعدادات", icon: Settings },
    ],
  },
]

/** Mobile bottom tab bar (§7): الرئيسية، الطلبات، حجوزاتي، المحادثات، الأرباح. */
export const PROVIDER_TABS: NavItem[] = [
  { href: "/provider", label: "الرئيسية", icon: Home, exact: true },
  { href: "/provider/requests", label: "الطلبات", icon: Inbox },
  { href: "/provider/bookings", label: "حجوزاتي", icon: CalendarCheck },
  { href: "/provider/messages", label: "المحادثات", icon: MessageSquare },
  { href: "/provider/earnings", label: "الأرباح", icon: Wallet },
]
