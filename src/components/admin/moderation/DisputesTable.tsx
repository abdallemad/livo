"use client"

import Link from "next/link"
import { AlertCircle, Paperclip, Scale } from "lucide-react"
import type { DisputeStatus } from "@prisma/client"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { DisputeStatusBadge, EmptyState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RESOLUTION_LABEL } from "@/constants/status"
import { useAdminDisputes } from "@/hooks/use-admin-moderation"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { disputeListQuerySchema } from "@/schemas/admin.schema"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"

const TABS: { status: DisputeStatus | undefined; label: string }[] = [
  { status: undefined, label: "All" },
  { status: "OPEN", label: "Open" },
  { status: "UNDER_REVIEW", label: "Under review" },
  { status: "RESOLVED", label: "Resolved" },
]
const COLUMNS = 7

/**
 * `/admin/disputes` (AD-05): the queue (oldest first; resolved = latest
 * decision first), status tabs with counts, search. Filters live in the URL.
 */
export function DisputesTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(disputeListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminDisputes(query)
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Complaints about a booking. Review the evidence and chat, then decide where the money goes."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const active = t.status === query.status
          const count = t.status ? data?.counts[t.status] : total
          const urgent = t.status && t.status !== "RESOLVED" && (count ?? 0) > 0
          return (
            <Link
              key={t.label}
              href={hrefWith({ status: t.status })}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-sm",
                active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count !== undefined ? (
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active || urgent ? "bg-primary/12 text-primary" : "bg-muted")}>
                  {formatNumber(count)}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <Card>
        <CardContent className="space-y-4">
          <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Booking number, name or reason" label="Search disputes" />

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load disputes"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Opened by</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-end">Held</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 4 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={COLUMNS}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="h-28 text-center text-muted-foreground">
                      <Scale className="mx-auto mb-1 size-5" aria-hidden />
                      {query.status === "OPEN" ? "No open disputes." : "No disputes match these filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link href={`/admin/disputes/${d.id}`} className="font-medium tabular-nums hover:underline">
                          {d.bookingNumber}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {d.customerName} → {d.providerName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {d.openedByName}
                        <span className="block text-xs text-muted-foreground">{d.openedBySide === "PROVIDER" ? "provider" : "customer"}</span>
                      </TableCell>
                      <TableCell className="max-w-80">
                        <span className="line-clamp-2 whitespace-normal" dir="auto">
                          {d.reason}
                        </span>
                        {d.evidenceCount ? (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="size-3" aria-hidden />
                            {d.evidenceCount} {d.evidenceCount === 1 ? "file" : "files"}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {d.held > 0 ? <bdi dir="ltr">{formatPrice(d.held)}</bdi> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDate(d.createdAt)}
                        {d.resolvedAt ? <span className="block text-xs text-muted-foreground">resolved {formatDate(d.resolvedAt)}</span> : null}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-col items-start gap-1">
                          <DisputeStatusBadge status={d.status} />
                          {d.resolution ? <span className="text-xs text-muted-foreground">{RESOLUTION_LABEL[d.resolution]}</span> : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant={d.status === "RESOLVED" ? "ghost" : "outline"} render={<Link href={`/admin/disputes/${d.id}`} />}>
                          {d.status === "RESOLVED" ? "View" : "Review"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {data && data.total > 0 ? (
            <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
