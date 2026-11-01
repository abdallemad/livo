"use client"

import Link from "next/link"
import { AlertCircle, CalendarCheck, CalendarClock, MapPin, Phone, SearchX, Star, Wallet } from "lucide-react"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { BookingStatusBadge, EmptyState, PageHeader } from "@/components/shared"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useMyBookings } from "@/hooks/use-customer-account"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { customerBookingListQuerySchema } from "@/schemas/customer-account.schema"
import type { CustomerBookingListItem } from "@/types/customer-account"
import { formatNumber, formatPhone, formatPrice } from "@/utils/format"
import { formatZonedDay, formatZonedTime } from "@/utils/zoned-time"

const TABS = [
  { id: undefined, key: "current", label: "Current" },
  { id: "finished", key: "finished", label: "Finished" },
  { id: "cancelled", key: "cancelled", label: "Cancelled" },
] as const

const URGENT = new Set(["PENDING_PAYMENT", "AWAITING_CONFIRMATION"])

function BookingCard({ b }: { b: CustomerBookingListItem }) {
  const href = `/account/bookings/${b.id}`
  const urgent = URGENT.has(b.status)
  return (
    <Card className={cn("gap-3", urgent && "border-primary/40")}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <BookingStatusBadge status={b.status} />
          <Badge variant="secondary">{b.source === "SERVICE" ? "Fixed price" : "From a quote"}</Badge>
          <span className="text-xs text-muted-foreground tabular-nums">{b.number}</span>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={href} className="hover:underline">
            {b.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">with {b.providerName}</p>
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
        {b.place ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            {b.place}
          </p>
        ) : null}
        <p className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" aria-hidden />
          <bdi dir="ltr" className="font-semibold tabular-nums">{formatPrice(b.amount)}</bdi>
          {b.paymentLabel ? <span className="text-muted-foreground">· {b.paymentLabel}</span> : null}
        </p>
        <p className={cn("rounded-md p-2.5", urgent ? "bg-primary/8 font-medium text-foreground" : "bg-muted/60 text-muted-foreground")}>{b.nextStep}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        {b.providerPhone ? (
          <Button variant="outline" render={<a href={`tel:${b.providerPhone}`} />}>
            <Phone data-icon="inline-start" aria-hidden />
            <bdi dir="ltr">{formatPhone(b.providerPhone)}</bdi>
          </Button>
        ) : null}
        {b.canReview ? (
          <Button variant="outline" render={<Link href={`/account/bookings/${b.id}/review`} />}>
            <Star data-icon="inline-start" aria-hidden />
            Leave a review
          </Button>
        ) : null}
        <Button className="ms-auto" variant={urgent ? "default" : "ghost"} render={<Link href={href} />}>
          {b.status === "PENDING_PAYMENT" ? "Pay now" : b.status === "AWAITING_CONFIRMATION" ? "Confirm the job" : "Details"}
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * `/account/bookings` (CU-13; docs/customer-account-feature.md): the customer's bookings — Current (soonest
 * first), Finished, Cancelled — each with the next step in plain words, the provider's phone once confirmed
 * (BR-02), and a review link for finished jobs (CU-10). Filters live in the URL.
 */
export function MyBookingsList() {
  const { query, hrefWith, setQuery } = useUrlQuery(customerBookingListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useMyBookings(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My bookings"
        description="Every job you booked: when, with whom, and what happens next."
        actions={
          <>
            {isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
            <Button variant="outline" render={<Link href="/services" />}>
              Book a service
            </Button>
          </>
        }
      />

      {data && data.needsAction > 0 && query.tab !== "current" ? (
        <Alert variant="info">
          <CalendarCheck aria-hidden />
          <AlertDescription>
            {formatNumber(data.needsAction)} {data.needsAction === 1 ? "booking needs" : "bookings need"} you to pay or confirm.{" "}
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
              className={cn("-mb-px flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-base", active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {t.label}
              {count !== undefined ? <span className={cn("rounded-full px-2 text-sm tabular-nums", active ? "bg-primary/12 text-primary" : "bg-muted")}>{formatNumber(count)}</span> : null}
            </Link>
          )
        })}
      </nav>

      <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Booking number or job" label="Search bookings" />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your bookings" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        query.q ? (
          <EmptyState icon={SearchX} title="No bookings match your search" action={<Button variant="outline" render={<Link href={hrefWith({ q: undefined })} />}>Clear search</Button>} />
        ) : query.tab === "current" ? (
          <EmptyState
            icon={CalendarCheck}
            title="No current bookings"
            description="Book a fixed-price service, or accept a quote on one of your requests."
            action={<Button render={<Link href="/services" />}>Browse services</Button>}
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
