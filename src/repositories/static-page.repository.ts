import "server-only"
import { db } from "@/lib/db"

/** `StaticPage` reads (AD-10 content, docs/landing-page.md). Only published rows ever leave this class. */
class StaticPageRepository {
  findPublished(slug: string) {
    return db.staticPage.findFirst({ where: { slug, isPublished: true }, select: { slug: true, title: true, body: true, updatedAt: true } })
  }

  findPublishedSlugs() {
    return db.staticPage.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } })
  }
}

export const staticPageRepository = new StaticPageRepository()
