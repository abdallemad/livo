import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/utils/format"

interface ListPaginationProps {
  page: number
  pageCount: number
  total: number
  hrefFor: (page: number) => string
}

/** Previous / next as real links (the page number lives in the URL), plus "Page X of Y · N results". */
export function ListPagination({ page, pageCount, total, hrefFor }: ListPaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2 pt-4 text-sm text-muted-foreground">
      <span className="tabular-nums">
        Page {formatNumber(page)} of {formatNumber(pageCount)} · {formatNumber(total)} {total === 1 ? "result" : "results"}
      </span>
      <div className="flex gap-1.5">
        {page > 1 ? (
          <Button size="sm" variant="outline" render={<Link href={hrefFor(page - 1)} scroll={false} />}>
            <ChevronLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
            Previous
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            <ChevronLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
            Previous
          </Button>
        )}
        {page < pageCount ? (
          <Button size="sm" variant="outline" render={<Link href={hrefFor(page + 1)} scroll={false} />}>
            Next
            <ChevronRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Next
            <ChevronRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
          </Button>
        )}
      </div>
    </nav>
  )
}
