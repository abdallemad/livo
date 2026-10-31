import { SITE_NAME } from "@/constants/site"

/**
 * Public header + footer navigation (docs/DESIGN-SYSTEM.md §7). Labels are
 * Arabic. Only list routes that exist — every link here ends up in crawled HTML.
 * Dashboard navs live in customer-nav.ts / provider-nav.ts / admin-nav.ts.
 */
export const MARKETING_NAV = [
  { href: "/services", label: "الخدمات" },
  { href: "/how-it-works", label: "كيف تعمل المنصة" },
  { href: "/become-provider", label: "انضم كمزود" },
] as const

export const FOOTER_NAV = [
  {
    label: "المنصة",
    items: [
      { href: "/services", label: "الخدمات" },
      { href: "/how-it-works", label: "كيف تعمل المنصة" },
      { href: "/become-provider", label: "انضم كمزود" },
    ],
  },
  {
    label: `عن ${SITE_NAME}`,
    items: [
      { href: "/about", label: "من نحن" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/faq", label: "الأسئلة الشائعة" },
    ],
  },
  {
    label: "قانوني",
    items: [
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/privacy", label: "سياسة الخصوصية" },
    ],
  },
] as const
