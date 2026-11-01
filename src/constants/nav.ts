import { SITE_NAME } from "@/constants/site"

/**
 * Public header + footer navigation (docs/DESIGN-SYSTEM.md §7). Labels are
 * English. Only list routes that exist — every link here ends up in crawled HTML.
 * Dashboard navs live in customer-nav.ts / provider-nav.ts / admin-nav.ts.
 */
export interface NavLink {
  href: string
  label: string
  /** One line under the label in the dropdown. */
  description?: string
}

export interface NavGroup {
  id: string
  label: string
  /** Where clicking the group label goes on touch / without JS — the group's main page. */
  href: string
  items: NavLink[]
  /** The Services group also lists the live top-level categories (from the DB, see `utils/nav.ts`). */
  withCategories?: boolean
}

/**
 * The header's grouped dropdowns (docs/navigation.md). Every href is a real public route that answers 200 — `/policies`
 * is left out because it 404s until an admin publishes it.
 */
export const MARKETING_NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "services",
    label: "Services",
    href: "/services",
    withCategories: true,
    items: [
      { href: "/services", label: "All services", description: "Fixed-price jobs you can book right away." },
      { href: "/category", label: "All categories", description: "Browse every kind of work on Livo." },
      { href: "/account/requests/new", label: "Request a quote", description: "Describe a bigger job and compare prices." },
    ],
  },
  {
    id: "providers",
    label: "For providers",
    href: "/become-provider",
    items: [
      { href: "/become-provider", label: "Become a provider", description: "Get verified and find jobs near you." },
      { href: "/sign-in", label: "Provider sign in", description: "Requests, quotes, bookings and payouts." },
    ],
  },
  {
    id: "help",
    label: "Help",
    href: "/how-it-works",
    items: [
      { href: "/how-it-works", label: "How it works", description: "From request to finished job and payment." },
      { href: "/faq", label: "FAQ", description: "Payments, bookings, reviews and more." },
      { href: "/about", label: `About ${SITE_NAME}`, description: "Who we are and how we check providers." },
      { href: "/contact", label: "Contact us", description: "Questions or a problem with a booking." },
    ],
  },
]

export const FOOTER_NAV = [
  {
    label: "Platform",
    items: [
      { href: "/services", label: "Services" },
      { href: "/category", label: "Categories" },
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
      { href: "/policies", label: "Our policies" },
    ],
  },
] as const
