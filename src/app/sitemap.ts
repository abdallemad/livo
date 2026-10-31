import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-url"

/**
 * Static entries (no lastModified) + DB entries via `sitemap.service.ts` once
 * public features exist. A DB outage must degrade to the static list
 * (try/catch + log), never a 500. Refreshed by `revalidateStorefront()`.
 */
export const revalidate = 3600

/** Static public pages (docs/SITEMAP.md §2). `/search` is noindex and stays out. */
const STATIC_PATHS = [
  "/",
  "/services",
  "/how-it-works",
  "/become-provider",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
]

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) }))
}
