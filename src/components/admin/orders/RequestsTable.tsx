"use client"

import Link from "next/link"
import { AlertCircle, ClipboardList } from "lucide-react"
import type { RequestStatus } from "@prisma/client"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { EmptyState, MetaBadge, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { REQUEST_STATUS, WORK_STATUS } from "@/constants/status"
import { useAdminCategories } from "@/hooks/use-admin-catalog"
import { useAdminRequests } from "@/hooks/use-admin-orders"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { requestListQuerySchema } from "@/schemas/admin.schema"
import type { AdminRequestListItem } from "@/types/admin"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"

const TABS: { status: RequestStatus | undefined; label: string }[] = [
  { status: undefined, label: "All" },
  { status: "OPEN", label: "Open" },
  { status: "ACCEPTED", label: "Booked" },
  { status: "DRAFT", label: "Drafts" },
  { status: "EXPIRED", label: "Expired" },
  { status: "CANCELLED", label: "Cancelled" },
]
const ALL = "ALL"
const COLUMNS = 7

/** OPEN with quotes reads "Quotes received" (the SRS state machine), everything else is the DB status. */
export const requestStatusMeta = (r: Pick<AdminRequestListItem, "status" | "quoteCount">) =>
  r.status === "OPEN" && r.quoteCount > 0 ? WORK_STATUS.QUOTES_RECEIVED : REQUEST_STATUS[r.status]

/**
 * `/admin/requests` (AD-04): every quote request with status tabs (+ counts),
 * category filter (a parent includes its sub-categories) and search. Filters live in the URL.
 */
export function RequestsTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(requestListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminRequests(query)
  const { data: categories } = useAdminCategories()
  const categoryOptions = [
    { id: ALL, name: "All categories" },
    ...(categories ?? []).map((c) => ({ id: c.id, name: c.parentName ? `${c.parentName} · ${c.nameEn ?? c.nameAr}` : (c.nameEn ?? c.nameAr) })),
  ]
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests and quotes"
        description="Every project request customers post, the quotes providers sent, and the resulting bookings."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const active = t.status === query.status
          const count = t.status ? data?.counts[t.status] : total
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
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary/12 text-primary" : "bg-muted")}>
                  {formatNumber(count)}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Title, customer or id" label="Search requests" />
            <div className="sm:w-56 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
              <OptionSelect
                id="filter-category"
                value={query.categoryId ?? ALL}
                onChange={(v) => setQuery({ categoryId: v === ALL ? undefined : v })}
                options={categoryOptions}
                placeholder="Category"
              />
            </div>
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load requests"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-end">Budget</TableHead>
                  <TableHead className="text-end">Quotes</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={COLUMNS}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="h-28 text-center text-muted-foreground">
                      <ClipboardList className="mx-auto mb-1 size-5" aria-hidden />
                      No requests match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-72">
                        <Link href={`/admin/requests/${r.id}`} className="font-medium whitespace-normal hover:underline">
                          {r.title}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          by{" "}
                          <Link href={`/admin/users/${r.customerId}`} className="hover:underline">
                            {r.customerName}
                          </Link>
                        </span>
                      </TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.area ?? r.city}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {r.budget !== null ? <bdi dir="ltr">{formatPrice(r.budget)}</bdi> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatNumber(r.quoteCount)}
                        {r.pendingQuoteCount ? <span className="block text-xs text-muted-foreground">{r.pendingQuoteCount} waiting</span> : null}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDate(r.createdAt)}
                        {r.status === "OPEN" && r.expiresAt ? (
                          <span className="block text-xs text-muted-foreground">expires {formatDate(r.expiresAt)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <MetaBadge meta={requestStatusMeta(r)} />
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
