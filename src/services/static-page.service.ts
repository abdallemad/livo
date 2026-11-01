import "server-only"
import { staticPageRepository as repo } from "@/repositories/static-page.repository"
import { sanitizePageHtml } from "@/utils/sanitize"

/**
 * Published `StaticPage` content for `/about`, `/terms`, `/privacy`, `/faq`, `/policies` (MK-05, AD-10;
 * docs/landing-page.md). Unpublished or missing → `null` → the page 404s gracefully. Bodies are re-sanitised here.
 */
export async function getPublishedPage(slug: string) {
  const page = await repo.findPublished(slug)
  return page ? { slug: page.slug, title: page.title, html: sanitizePageHtml(page.body), updatedAt: page.updatedAt.toISOString() } : null
}

/** For the sitemap and the landing page's "Our policies" link: only pages that would answer 200. */
export async function getPublishedSlugs() {
  return repo.findPublishedSlugs()
}
