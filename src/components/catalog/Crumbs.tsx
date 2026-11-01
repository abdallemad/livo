import Link from "next/link"
import { ChevronRight } from "lucide-react"

/** Visible breadcrumb; mirrors the `BreadcrumbList` JSON-LD crumb for crumb (CLAUDE.md §11). The last crumb is the current page. */
export function Crumbs({ crumbs }: { crumbs: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden /> : null}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="font-medium text-foreground">
                {c.name}
              </span>
            ) : (
              <Link href={c.path} className="hover:text-foreground hover:underline">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
