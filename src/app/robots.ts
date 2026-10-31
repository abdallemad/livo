import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-url"

/**
 * Private pages use `noindex` meta, not Disallow (a disallowed URL can still
 * be indexed from links). `/admin` is deliberately not named — it 404s.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/api/images/"], disallow: ["/api/", "/search?"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
