/**
 * Brand / site identity. The ONLY place the brand name may appear —
 * everything else imports from here (CLAUDE.md §9).
 */
export const SITE_NAME = "Livo"
export const SITE_TITLE = "Livo — Trusted home services and construction"
export const SITE_DESCRIPTION =
  "Book maintenance, finishing, and construction services from verified providers, compare quotes, and pay safely."
export const SITE_LOCALE = "en_US"
export const SITE_LANG = "en"
export const SITE_DIR = "ltr"
export const SITE_LOGO = "/logo.svg"

/** Spread into any page-level `openGraph` — a page's object REPLACES the root's. */
export const DEFAULT_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: SITE_LOCALE,
  type: "website",
} as const

// ---------------------------------------------------------------------------
// Launch scope & contact (docs/landing-page.md). Placeholders are marked TODO: confirm before launch.
// Values left `null` / empty are simply not rendered — never ship a made-up phone number or profile.
// ---------------------------------------------------------------------------

/** TODO: confirm — the seed's only active city is Cairo (SRS A1: one city at launch). */
export const LAUNCH_CITY = "Cairo"

/**
 * TODO: confirm — the first services named in the hero (business analysis §6.2: 3–5 categories).
 * Slugs must match `Category.slug`; the labels are the English names shown on the page.
 */
export const LAUNCH_CATEGORIES = [
  { slug: "plumbing", label: "plumbing" },
  { slug: "electrical", label: "electrical" },
  { slug: "cleaning", label: "cleaning" },
  { slug: "ac", label: "air conditioning" },
  { slug: "finishing", label: "painting & finishing" },
] as const

/** TODO: confirm — support line shown in the footer, e.g. "+20 100 000 0000". `null` = hidden. */
export const SUPPORT_PHONE: string | null = null
/** TODO: confirm — WhatsApp number in international digits only, e.g. "201000000000". `null` = hidden. */
export const SUPPORT_WHATSAPP: string | null = null
/** TODO: confirm — official profiles. Empty = no social links rendered. */
export const SOCIAL_LINKS: readonly { label: string; href: string }[] = []

/** `StaticPage` slug + route of the policies page linked from the trust section and the footer. */
export const POLICIES_PATH = "/policies"
