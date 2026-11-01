"use client"

import Link from "next/link"
import { AlertCircle, CalendarCheck, FileText, MapPin, SearchX } from "lucide-react"
import { toast } from "sonner"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { BookingStatusBadge, ConfirmDialog, EmptyState, MetaBadge, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { QUOTE_STATUS } from "@/constants/status"
import { useProviderQuotes, useWithdrawQuote } from "@/hooks/use-provider-workspace"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { PROVIDER_QUOTE_STATUSES, providerQuoteListQuerySchema } from "@/schemas/provider.schema"
import type { ProviderQuoteListItem } from "@/types/provider"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"

const REQUEST_CLOSED: Record<string, string> = {
  ACCEPTED: "Customer chose a provider",
  CANCELLED: "Request cancelled",
  EXPIRED: "Request expired",
  DRAFT: "Request not published",
}

function QuoteCard({ q }: { q: ProviderQuoteListItem }) {
  const withdraw = useWithdrawQuote()
  return (
    <Card className={cn("gap-3", q.status === "ACCEPTED" && "border-success/40")}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <MetaBadge meta={QUOTE_STATUS[q.status]} />
          <Badge variant="secondary">{q.request.category}</Badge>
          {q.status === "PENDING" && q.request.status !== "OPEN" ? <Badge variant="neutral">{REQUEST_CLOSED[q.request.status]}</Badge> : null}
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={`/provider/requests/${q.request.id}`} className="hover:underline">
            {q.request.title}
          </Link>
        </CardTitle>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {q.request.area ? `${q.request.area}, ${q.request.city}` : q.request.city}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Your price</dt>
            <dd className="text-base font-semibold tabular-nums">
              <bdi dir="ltr">{formatPrice(q.price)}</bdi>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Takes</dt>
            <dd className="font-medium">{q.durationDays ? `${formatNumber(q.durationDays)} ${q.durationDays === 1 ? "day" : "days"}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Customer budget</dt>
            <dd className="font-medium tabular-nums">{q.request.budget !== null ? <bdi dir="ltr">{formatPrice(q.request.budget)}</bdi> : "Not given"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Quotes on this request</dt>
            <dd className="font-medium tabular-nums">{formatNumber(q.request.quoteCount)}</dd>
          </div>
        </dl>
        {q.message ? <p className="line-clamp-2 whitespace-pre-line text-muted-foreground">“{q.message}”</p> : null}
        <p className="text-xs text-muted-foreground">
          Sent {formatDate(q.createdAt)}
          {q.validUntil && q.status === "PENDING" ? ` · valid until ${formatDate(q.validUntil)}` : ""}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        {q.booking ? (
          <>
            <span className="flex items-center gap-2 text-sm">
              <CalendarCheck className="size-4 text-success" aria-hidden />
              Booking {q.booking.number} <BookingStatusBadge status={q.booking.status} />
            </span>
            <Button render={<Link href={`/provider/bookings/${q.booking.id}`} />}>Open the booking</Button>
          </>
        ) : (
          <>
            {!q.withdrawBlockedReason ? (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" className="text-destructive" disabled={withdraw.isPending}>
                    Withdraw quote
                  </Button>
                }
                title="Withdraw this quote?"
                description={`The customer won't see your ${formatPrice(q.price)} quote for “${q.request.title}” any more.`}
                confirmLabel="Withdraw quote"
                cancelLabel="Keep it"
                onConfirm={() =>
                  withdraw.mutate(q.id, { onSuccess: () => toast.success("Quote withdrawn"), onError: (e) => toast.error(e.message) })
                }
              />
            ) : (
              <span />
            )}
            <Button variant="outline" render={<Link href={`/provider/requests/${q.request.id}`} />}>
              View the request
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * `/provider/quotes` (PR-07, docs/provider-quotes-bookings-feature.md): every quote the provider sent,
 * with its status — waiting, accepted (→ its booking), not chosen, withdrawn, expired — and
 * withdrawing a waiting one. Filters live in the URL.
 */
export function QuotesList() {
  const { query, hrefWith, setQuery } = useUrlQuery(providerQuoteListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useProviderQuotes(query)
  const total = data ? Object.values(data.counts).reduce((s, n) => s + n, 0) : undefined
  const tabs = [{ status: undefined, label: "All", count: total }, ...PROVIDER_QUOTE_STATUSES.map((s) => ({ status: s, label: QUOTE_STATUS[s].label, count: data?.counts[s] }))]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My quotes"
        description="Prices you sent on customers' requests, and what happened to each."
        actions={
          <>
            {isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
            <Button render={<Link href="/provider/requests" />}>Find new requests</Button>
          </>
        }
      />

      <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => {
          const active = t.status === query.status
          return (
            <Link
              key={t.label}
              href={hrefWith({ status: t.status })}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-base",
                active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count !== undefined ? (
                <span className={cn("rounded-full px-2 text-sm tabular-nums", active ? "bg-primary/12 text-primary" : "bg-muted")}>{formatNumber(t.count)}</span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Request title" label="Search quotes" />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your quotes" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        query.q || query.status ? (
          <EmptyState
            icon={SearchX}
            title="No quotes match"
            action={<Button variant="outline" render={<Link href={hrefWith({ q: undefined, status: undefined })} />}>Show all quotes</Button>}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="You haven't sent any quotes yet"
            description="Open a request in your specialty and send your price."
            action={<Button render={<Link href="/provider/requests" />}>See available requests</Button>}
          />
        )
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((q) => (
            <QuoteCard key={q.id} q={q} />
          ))}
        </div>
      )}

      {data && data.total > 0 ? <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} /> : null}
    </div>
  )
}
