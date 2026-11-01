"use client"

import Link from "next/link"
import { AlertCircle, CalendarCheck } from "lucide-react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { BookingStatusBadge, EmptyState, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BOOKING_STATUS, ESCROW_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/status"
import { useAdminBookings } from "@/hooks/use-admin-orders"
import { useUrlQuery } from "@/hooks/use-url-query"
import { ADMIN_BOOKING_STATUSES, bookingListQuerySchema } from "@/schemas/admin.schema"
import { formatDate, formatDateTime, formatNumber, formatPrice } from "@/utils/format"

const ALL = "ALL"
const SOURCE_OPTIONS = [
  { id: ALL, name: "Fixed price + quotes" },
  { id: "SERVICE", name: "Fixed-price services" },
  { id: "QUOTE", name: "From quotes" },
]
const COLUMNS = 7

/**
 * `/admin/bookings` (AD-04): every booking, filterable by status (with
 * counts), source and search (number, customer, provider, title). Filters live in the URL.
 */
export function BookingsTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(bookingListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminBookings(query)
  const statusOptions = [
    { id: ALL, name: "Any status" },
    ...ADMIN_BOOKING_STATUSES.map((s) => ({
      id: s,
      name: data ? `${BOOKING_STATUS[s].label} (${formatNumber(data.counts[s])})` : BOOKING_STATUS[s].label,
    })),
  ]
  const filtered = !!(query.q || query.status || query.source)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Every booking on the platform: who, how much, payment and escrow state."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Number, name or title" label="Search bookings" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="sm:w-56 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-status"
                  value={query.status ?? ALL}
                  onChange={(v) => setQuery({ status: v === ALL ? undefined : v })}
                  options={statusOptions}
                  placeholder="Status"
                />
              </div>
              <div className="sm:w-52 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-source"
                  value={query.source ?? ALL}
                  onChange={(v) => setQuery({ source: v === ALL ? undefined : v })}
                  options={SOURCE_OPTIONS}
                  placeholder="Type"
                />
              </div>
            </div>
            {filtered ? (
              <Button size="sm" variant="ghost" render={<Link href={hrefWith({ q: undefined, status: undefined, source: undefined })} />}>
                Clear filters
              </Button>
            ) : null}
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load bookings"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer → provider</TableHead>
                  <TableHead className="text-end">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">
                    <span className="sr-only">Open</span>
                  </TableHead>
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
                      <CalendarCheck className="mx-auto mb-1 size-5" aria-hidden />
                      {filtered ? "No bookings match these filters." : "No bookings yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="max-w-64">
                        <Link href={`/admin/bookings/${b.id}`} className="font-medium tabular-nums hover:underline">
                          {b.number}
                        </Link>
                        <span className="line-clamp-1 text-xs whitespace-normal text-muted-foreground">{b.title}</span>
                        <Badge variant="secondary" className="mt-1">
                          {b.source === "SERVICE" ? "Fixed price" : "Quote"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${b.customerId}`} className="hover:underline">
                          {b.customerName}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          →{" "}
                          <Link href={`/admin/providers/${b.providerId}`} className="hover:underline">
                            {b.providerName}
                          </Link>
                        </span>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        <bdi dir="ltr">{formatPrice(b.amount)}</bdi>
                        <span className="block text-xs text-muted-foreground">
                          fee <bdi dir="ltr">{formatPrice(b.commissionAmount)}</bdi>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {b.paymentMethod ? PAYMENT_METHOD_LABEL[b.paymentMethod] : "—"}
                        {b.escrowState && b.escrowState !== "NONE" ? (
                          <span className="block text-xs text-muted-foreground">{ESCROW_LABEL[b.escrowState]}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {b.scheduledAt ? formatDateTime(b.scheduledAt) : "—"}
                        <span className="block text-xs text-muted-foreground">booked {formatDate(b.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant="ghost" render={<Link href={`/admin/bookings/${b.id}`} />}>
                          Open
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
