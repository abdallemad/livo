/**
 * Brand / site identity. The ONLY place the brand name may appear —
 * everything else imports from here (CLAUDE.md §9).
 */
export const SITE_NAME = "Livo"
export const SITE_TITLE = "Livo — خدمات منزلية وبناء موثوقة"
export const SITE_DESCRIPTION =
  "اطلب خدمات الصيانة والتشطيب والبناء من مزودين موثّقين، قارن العروض، وادفع بأمان."
export const SITE_LOCALE = "ar_EG"
export const SITE_LANG = "ar"
export const SITE_DIR = "rtl"
export const SITE_LOGO = "/logo.svg"

/** Spread into any page-level `openGraph` — a page's object REPLACES the root's. */
export const DEFAULT_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: SITE_LOCALE,
  type: "website",
} as const
