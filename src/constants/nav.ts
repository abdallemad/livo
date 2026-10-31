import { SITE_NAME } from "@/constants/site"

/**
 * Public header + footer navigation (docs/DESIGN-SYSTEM.md §7). Labels are
 * English. Only list routes that exist — every link here ends up in crawled HTML.
 * Dashboard navs live in customer-nav.ts / provider-nav.ts / admin-nav.ts.
 */
export const MARKETING_NAV = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/become-provider", label: "Become a provider" },
] as const

export const FOOTER_NAV = [
  {
    label: "Platform",
    items: [
      { href: "/services", label: "Services" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/become-provider", label: "Become a provider" },
    ],
  },
  {
    label: `About ${SITE_NAME}`,
    items: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact us" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
] as const
