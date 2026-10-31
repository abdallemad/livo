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
