import { Crumbs } from "@/components/catalog/Crumbs"
import { JsonLd } from "@/components/seo/json-ld"
import { formatDate } from "@/utils/format"
import { breadcrumbJsonLd } from "@/utils/structured-data"

/**
 * A published `StaticPage` (MK-05, AD-10; docs/landing-page.md): title, last update, and the body — sanitised by the
 * service before it gets here, so `dangerouslySetInnerHTML` only ever receives allow-listed markup.
 */
export function StaticPageView({ page, path }: { page: { title: string; html: string; updatedAt: string }; path: string }) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: page.title, path },
  ]
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6 md:py-16">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Crumbs crumbs={crumbs} />
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold md:text-4xl">{page.title}</h1>
        <p className="text-sm text-muted-foreground">Last updated {formatDate(page.updatedAt)}</p>
      </header>
      <div
        className="space-y-4 text-base leading-relaxed [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:ms-5 [&_ol]:list-decimal [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </article>
  )
}
