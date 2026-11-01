"use client"

import Link from "next/link"
import { AlertCircle, ClipboardList, Plus, SearchX } from "lucide-react"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { EmptyState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useMyRequests } from "@/hooks/use-customer"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { customerRequestListQuerySchema } from "@/schemas/customer.schema"
import { formatNumber } from "@/utils/format"
import { MyRequestCard } from "./MyRequestCard"

const TABS = [
  { id: undefined, key: "active", label: "Active" },
  { id: "booked", key: "booked", label: "Booked" },
  { id: "closed", key: "closed", label: "Closed" },
] as const

/**
 * `/account/requests` (CU-13, CU-11; docs/customer-dashboard-requests-feature.md): the customer's quote
 * requests — Active (draft, open), Booked (a quote was accepted), Closed (cancelled, expired) — with
 * their state, quotes and next step. Filters live in the URL.
 */
export function MyRequestsList() {
  const { query, hrefWith, setQuery } = useUrlQuery(customerRequestListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useMyRequests(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My requests"
        description="Jobs you described so providers can send you their prices."
        actions={
          <>
            {isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
            <Button size="lg" render={<Link href="/account/requests/new" />}>
              <Plus data-icon="inline-start" aria-hidden />
              Request a quote
            </Button>
          </>
        }
      />

      <nav aria-label="Requests" className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => {
          const active = query.tab === t.key
          const count = data?.counts[t.key]
          return (
            <Link
              key={t.key}
              href={hrefWith({ tab: t.id })}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-base",
                active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count !== undefined ? (
                <span className={cn("rounded-full px-2 text-sm tabular-nums", active ? "bg-primary/12 text-primary" : "bg-muted")}>{formatNumber(count)}</span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Search your requests" label="Search requests" />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your requests" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        query.q ? (
          <EmptyState icon={SearchX} title="No requests match your search" action={<Button variant="outline" render={<Link href={hrefWith({ q: undefined })} />}>Clear search</Button>} />
        ) : query.tab === "active" ? (
          <EmptyState
            icon={ClipboardList}
            title="No active requests"
            description="Describe a job — tiling a room, rewiring a flat — and verified providers send you their prices to compare."
            action={<Button render={<Link href="/account/requests/new" />}>Request a quote</Button>}
          />
        ) : (
          <EmptyState icon={ClipboardList} title={query.tab === "booked" ? "No booked requests yet" : "No closed requests"} />
        )
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((r) => (
            <MyRequestCard key={r.id} r={r} />
          ))}
        </div>
      )}

      {data && data.total > 0 ? <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} /> : null}
    </div>
  )
}
