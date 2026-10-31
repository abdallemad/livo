/**
 * Public header navigation. Labels are Arabic (RTL-first, SRS A2).
 * Only list routes that exist — every link here ends up in crawled HTML.
 */
export const MARKETING_NAV = [{ href: "/", label: "الرئيسية" }] as const

/** Admin sidebar. Add one entry per admin feature (CLAUDE.md §14 step 7). */
export const ADMIN_NAV = [{ href: "/admin", label: "لوحة التحكم" }] as const
