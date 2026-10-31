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
  { items: [{ href: "/admin", label: "لوحة التحكم", icon: Gauge, exact: true }] },
  {
    label: "الناس",
    items: [
      { href: "/admin/providers", label: "طلبات المزودين", icon: BadgeCheck },
      { href: "/admin/users", label: "المستخدمون", icon: Users },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      { href: "/admin/categories", label: "التصنيفات", icon: Tags },
      { href: "/admin/services", label: "الخدمات", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "التشغيل",
    items: [
      { href: "/admin/requests", label: "الطلبات وعروض الأسعار", icon: ClipboardList },
      { href: "/admin/bookings", label: "الحجوزات", icon: CalendarCheck },
      { href: "/admin/disputes", label: "النزاعات", icon: Scale },
      { href: "/admin/reviews", label: "التقييمات", icon: Star },
    ],
  },
  {
    label: "الفلوس",
    items: [
      { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
      { href: "/admin/payouts", label: "طلبات السحب", icon: Banknote },
      { href: "/admin/settings/commission", label: "العمولة", icon: Percent },
    ],
  },
  {
    label: "النظام",
    items: [
      { href: "/admin/content", label: "محتوى الصفحات", icon: FileText },
      { href: "/admin/audit-log", label: "سجل العمليات", icon: History },
    ],
  },
]
