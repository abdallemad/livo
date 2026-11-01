"use client"

import Link from "next/link"
import { AlertCircle, CalendarCheck, CalendarClock, Lock, MapPin, SearchX, Wallet } from "lucide-react"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { BookingStatusBadge, EmptyState, PageHeader } from "@/components/shared"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useProviderBookings } from "@/hooks/use-provider-workspace"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { providerBookingListQuerySchema } from "@/schemas/provider.schema"
import type { ProviderBookingListItem } from "@/types/provider"
import { formatNumber, formatPrice } from "@/utils/format"
import { formatZonedDateTime, formatZonedDay, formatZonedTime } from "@/utils/zoned-time"
import { BookingActions } from "./BookingActions"

const TABS = [
  { id: undefined, key: "current", label: "Current" },
  { id: "finished", key: "finished", label: "Finished" },
  { id: "cancelled", key: "cancelled", label: "Cancelled" },
] as const

function BookingCard({ b }: { b: ProviderBookingListItem }) {
  const href = `/provider/bookings/${b.id}`
  const toAccept = b.status === "PENDING_PROVIDER"
  return (
    <Card className={cn("gap-3", toAccept && "border-primary/40")}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <BookingStatusBadge status={b.status} />
          <Badge variant="secondary">{b.source === "SERVICE" ? "Fixed price" : "From your quote"}</Badge>
          <span className="text-xs text-muted-foreground tabular-nums">{b.number}</span>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={href} className="hover:underline">
            {b.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          {b.scheduledAt ? (
            <bdi dir="ltr">
              {formatZonedDay(b.scheduledAt)} · {formatZonedTime(b.scheduledAt)}
            </bdi>
          ) : (
            "Time to be agreed"
          )}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          <span>
            {b.customerFirstName ? `${b.customerFirstName} · ` : ""}
            {b.place ?? "Address not given"}
          </span>
          {!b.contactUnlocked ? <Lock className="size-3.5" aria-label="Full address after you accept" /> : null}
        </p>
        <p className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" aria-hidden />
          <span>
            You get <bdi dir="ltr" className="font-semibold tabular-nums">{formatPrice(b.providerNet)}</bdi>
            <span className="text-muted-foreground">
              {" "}
              of <bdi dir="ltr">{formatPrice(b.amount)}</bdi> · {b.paymentSummary}
            </span>
          </span>
        </p>
        {b.status === "AWAITING_CONFIRMATION" && b.autoReleaseAt ? (
          <p className="text-muted-foreground">Waiting for the customer to confirm — counts as done on {formatZonedDateTime(b.autoReleaseAt)} if they don&apos;t report a problem.</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <BookingActions booking={b} />
        <Button variant="ghost" className="sm:ms-auto" render={<Link href={href} />}>
          Details
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * `/provider/bookings` (PR-08, docs/provider-quotes-bookings-feature.md): the provider's bookings as
 * cards — Current (soonest first), Finished, Cancelled — with the valid next action on each.
 * Customer details stay hidden until the provider accepts (BR-02). Filters live in the URL.
 */
export function BookingsList() {
  const { query, hrefWith, setQuery } = useUrlQuery(providerBookingListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useProviderBookings(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My bookings"
        description="Jobs customers booked with you. Accept new ones, start on the day, and mark them done when you finish."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      {data && data.toAccept > 0 && query.tab !== "current" ? (
        <Alert variant="info">
          <CalendarCheck aria-hidden />
          <AlertDescription>
            {formatNumber(data.toAccept)} {data.toAccept === 1 ? "booking is" : "bookings are"} waiting for you to accept.{" "}
            <Link href={hrefWith({ tab: undefined })} className="font-medium underline underline-offset-4">
              See them
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <nav aria-label="Bookings" className="flex gap-1 overflow-x-auto border-b">
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

      <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Booking number or job title" label="Search bookings" />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your bookings" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        query.q ? (
          <EmptyState icon={SearchX} title="No bookings match your search" action={<Button variant="outline" render={<Link href={hrefWith({ q: undefined })} />}>Clear search</Button>} />
        ) : query.tab === "current" ? (
          <EmptyState
            icon={CalendarCheck}
            title="No current bookings"
            description="Customers book your fixed-price services directly, or accept one of your quotes."
            action={<Button variant="outline" render={<Link href="/provider/requests" />}>Find requests to quote</Button>}
          />
        ) : (
          <EmptyState icon={CalendarCheck} title={query.tab === "finished" ? "No finished jobs yet" : "No cancelled bookings"} />
        )
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}

      {data && data.total > 0 ? <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} /> : null}
    </div>
  )
}
