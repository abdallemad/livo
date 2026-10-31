import { Construction } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { PageHeader } from "./page-header"

interface PagePlaceholderProps {
  title: string
  description: string
  /** The route as written in docs/SITEMAP.md, e.g. `/account/requests/[id]`. */
  route: string
  /** SRS requirement ids, e.g. ["CU-04", "CU-05"]. */
  reqs?: string[]
  /** Optional preview of the main action (e.g. a disabled Button). */
  actions?: React.ReactNode
}

/**
 * Temporary body for every route listed in docs/SITEMAP.md until its feature
 * is built (DESIGN-SYSTEM.md §14 Phase C). Delete the usage — not this file —
 * when the real page lands; delete this file when nothing imports it.
 */
export function PagePlaceholder({ title, description, route, reqs = [], actions }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      <Card className="items-center gap-3 border-dashed px-6 py-12 text-center shadow-none">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-6" aria-hidden />
        </span>
        <p className="font-heading text-lg font-semibold">الصفحة دي لسه تحت الإنشاء</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="font-mono" dir="ltr">
            {route}
          </Badge>
          {reqs.map((r) => (
            <Badge key={r} variant="neutral" dir="ltr">
              {r}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}
