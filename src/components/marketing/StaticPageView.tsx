import { Crumbs } from "@/components/catalog/Crumbs"
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
        <div
          className="-mt-4 space-y-4 rounded-[28px] border bg-card/95 p-6 text-base leading-relaxed shadow-card md:p-10 [&_a]:font-medium [&_a]:text-violet [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-primary [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold md:[&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:font-semibold [&_li]:ms-5 [&_li]:marker:text-coral [&_ol]:list-decimal [&_p]:text-muted-foreground [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
      </div>
    </article>
  )
}
