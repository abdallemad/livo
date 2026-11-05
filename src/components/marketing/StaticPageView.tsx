import { Crumbs } from "@/components/catalog/Crumbs"
import { CmsBody } from "@/components/help/CmsBody"
import { JsonLd } from "@/components/seo/json-ld"
import { formatDate } from "@/utils/format"
import { breadcrumbJsonLd } from "@/utils/structured-data"
import { PageHero } from "./PageHero"

/**
 * A published `StaticPage` (MK-05, AD-10; docs/landing-page.md): title, last update, and the body — sanitised by the
 * service before it gets here, so `dangerouslySetInnerHTML` only ever receives allow-listed markup. Styled as the
 * website's inner pages: a ghost-word page hero, then the body on a white rounded panel.
 */
export function StaticPageView({ page, path }: { page: { title: string; html: string; updatedAt: string }; path: string }) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: page.title, path },
  ]
  return (
    <article>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHero title={page.title} crumbs={<Crumbs crumbs={crumbs} />}>
        <p className="inline-flex rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-soft">Last updated {formatDate(page.updatedAt)}</p>
      </PageHero>
      <div className="mx-auto max-w-4xl px-4 pb-6 md:px-6">
        <CmsBody html={page.html} className="-mt-4" />
      </div>
    </article>
  )
}
