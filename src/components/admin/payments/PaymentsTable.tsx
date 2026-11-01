"use client"

import Link from "next/link"
import { AlertCircle, AlertTriangle, Banknote, CircleDollarSign, Clock, Lock, RotateCcw, Send } from "lucide-react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { BookingStatusBadge, EmptyState, MetaBadge, PageHeader, StatCard } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ESCROW_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/constants/status"
import { useAdminPayments } from "@/hooks/use-admin-payments"
import { useUrlQuery } from "@/hooks/use-url-query"
import {
  ADMIN_ESCROW_STATES,
  ADMIN_PAYMENT_METHODS,
  ADMIN_PAYMENT_STATUSES,
  paymentListQuerySchema,
} from "@/schemas/admin.schema"
import { formatDate, formatDateTime, formatNumber, formatPrice } from "@/utils/format"

const ALL = "ALL"
const METHOD_OPTIONS = [{ id: ALL, name: "Online + cash" }, ...ADMIN_PAYMENT_METHODS.map((m) => ({ id: m, name: PAYMENT_METHOD_LABEL[m] }))]
const ESCROW_OPTIONS = [{ id: ALL, name: "Any escrow state" }, ...ADMIN_ESCROW_STATES.map((e) => ({ id: e, name: ESCROW_LABEL[e] }))]
const COLUMNS = 7
const SELECT_CLASS = "[&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm"

/**
 * `/admin/payments` (AD-07, docs/admin-payments-feature.md): money totals across every
 * payment, then the payments themselves filterable by status (with counts), method, escrow
 * state and search (booking number, names, gateway ref, exact payment id). Filters live in
 * the URL. Read-only — refunds and releases happen on the dispute / booking flow.
 */
export function PaymentsTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(paymentListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminPayments(query)
  const statusOptions = [
    { id: ALL, name: "Any status" },
    ...ADMIN_PAYMENT_STATUSES.map((s) => ({
      id: s,
      name: data ? `${PAYMENT_STATUS[s].label} (${formatNumber(data.counts[s])})` : PAYMENT_STATUS[s].label,
    })),
  ]
  const filtered = !!(query.q || query.status || query.method || query.escrow)
  const summary = data?.summary

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every payment on the platform: what was collected, what Livo still holds in escrow, what reached providers and what was refunded."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <section aria-label="Payment totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary ? (
          <>
            <StatCard
              label="Collected online"
              value={formatPrice(summary.captured)}
              icon={CircleDollarSign}
              hint={`${formatNumber(summary.capturedCount)} payments through Livo`}
            />
            <StatCard
              label="Held in escrow"
              value={formatPrice(summary.held)}
              icon={Lock}
              hint={`${formatNumber(summary.heldCount)} payments waiting for completion or a dispute`}
            />
            <StatCard
              label="Released to providers"
              value={formatPrice(summary.released)}
              icon={Send}
              hint={`Refunded to customers: ${formatPrice(summary.refunded)}`}
            />
            <StatCard
              label="Cash jobs"
              value={formatPrice(summary.cash)}
              icon={Banknote}
              hint={`${formatNumber(summary.cashCount)} paid in cash · ${formatNumber(summary.pendingCount)} checkouts pending · ${formatNumber(summary.failedCount)} failed`}
            />
          </>
        ) : isError ? null : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
        )}
      </section>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchBox
              value={query.q}
              onSearch={(q) => setQuery({ q })}
              placeholder="Booking number, name or gateway ref"
              label="Search payments"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
              <div className={`lg:w-52 ${SELECT_CLASS}`}>
                <OptionSelect
                  id="filter-status"
                  value={query.status ?? ALL}
                  onChange={(v) => setQuery({ status: v === ALL ? undefined : v })}
                  options={statusOptions}
                  placeholder="Status"
                />
              </div>
              <div className={`lg:w-40 ${SELECT_CLASS}`}>
                <OptionSelect
                  id="filter-method"
                  value={query.method ?? ALL}
                  onChange={(v) => setQuery({ method: v === ALL ? undefined : v })}
                  options={METHOD_OPTIONS}
                  placeholder="Method"
                />
              </div>
              <div className={`lg:w-52 ${SELECT_CLASS}`}>
                <OptionSelect
                  id="filter-escrow"
                  value={query.escrow ?? ALL}
                  onChange={(v) => setQuery({ escrow: v === ALL ? undefined : v })}
                  options={ESCROW_OPTIONS}
                  placeholder="Escrow"
                />
              </div>
            </div>
            {filtered ? (
              <Button
                size="sm"
                variant="ghost"
                render={<Link href={hrefWith({ q: undefined, status: undefined, method: undefined, escrow: undefined })} />}
              >
                Clear filters
              </Button>
            ) : null}
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load payments"
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
                  <TableHead>Method / escrow</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">
                    <span className="sr-only">Open booking</span>
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
                      <CircleDollarSign className="mx-auto mb-1 size-5" aria-hidden />
                      {filtered ? "No payments match these filters." : "No payments yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-64">
                        <Link href={`/admin/bookings/${p.bookingId}`} className="font-medium tabular-nums hover:underline">
                          {p.bookingNumber}
                        </Link>
                        <span className="line-clamp-1 text-xs whitespace-normal text-muted-foreground">{p.bookingTitle}</span>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <BookingStatusBadge status={p.bookingStatus} />
                          {p.milestone ? <Badge variant="secondary">Milestone: {p.milestone}</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${p.customerId}`} className="hover:underline">
                          {p.customerName}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          →{" "}
                          <Link href={`/admin/providers/${p.providerId}`} className="hover:underline">
                            {p.providerName}
                          </Link>
                        </span>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        <bdi dir="ltr">{formatPrice(p.amount)}</bdi>
                        {p.refundedAmount > 0 ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-warning">
                            <RotateCcw className="size-3" aria-hidden />
                            refunded <bdi dir="ltr">{formatPrice(p.refundedAmount)}</bdi>
                          </span>
                        ) : null}
                        <span className="block text-xs text-muted-foreground">
                          fee {formatNumber(p.commissionRate)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {PAYMENT_METHOD_LABEL[p.method]}
                        {p.method === "ONLINE" ? (
                          <span className="block text-xs text-muted-foreground">{ESCROW_LABEL[p.escrowState]}</span>
                        ) : null}
                        {p.gatewayRef ? (
                          <span className="block max-w-40 truncate font-mono text-xs text-muted-foreground" title={p.gatewayRef}>
                            {p.gatewayRef}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {p.paidAt ? (
                          <>paid {formatDateTime(p.paidAt)}</>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-3" aria-hidden />
                            created {formatDate(p.createdAt)}
                          </span>
                        )}
                        {p.releasedAt ? (
                          <span className="block text-xs text-muted-foreground">released {formatDate(p.releasedAt)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <MetaBadge meta={PAYMENT_STATUS[p.status]} />
                        {p.dispute ? (
                          <Link
                            href={`/admin/disputes/${p.dispute.id}`}
                            className="mt-1 flex items-center gap-1 text-xs text-destructive hover:underline"
                          >
                            <AlertTriangle className="size-3" aria-hidden />
                            Disputed
                          </Link>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant="ghost" render={<Link href={`/admin/bookings/${p.bookingId}`} />}>
                          Booking
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
