import {
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  History,
  Percent,
  Scale,
  Star,
  Tags,
  Users,
} from "lucide-react"
import type { NavGroup } from "@/types/nav"

/** Admin sidebar (`/admin/*`, docs/SITEMAP.md §5). One entry per admin feature (CLAUDE.md §14 step 7). */
export const ADMIN_NAV: NavGroup[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: Gauge, exact: true }] },
  {
    label: "People",
    items: [
      { href: "/admin/providers", label: "Provider applications", icon: BadgeCheck },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/services", label: "Services", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/requests", label: "Requests and quotes", icon: ClipboardList },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      { href: "/admin/disputes", label: "Disputes", icon: Scale },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/payouts", label: "Payout requests", icon: Banknote },
      { href: "/admin/settings/commission", label: "Commission", icon: Percent },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/content", label: "Page content", icon: FileText },
      { href: "/admin/audit-log", label: "Audit log", icon: History },
    ],
  },
]
