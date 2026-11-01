"use client"

import Link from "next/link"
import { AlertCircle, CreditCard, FileText, Lock, RotateCcw, Wallet } from "lucide-react"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { EmptyState, MetaBadge, PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/constants/status"
import { useMyPayments } from "@/hooks/use-customer-account"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { customerPaymentQuerySchema } from "@/schemas/customer-account.schema"
import { formatNumber, formatPrice } from "@/utils/format"
import { formatZonedDateTime } from "@/utils/zoned-time"

/**
 * `/account/payments` (CU-13, SY-07; docs/customer-account-feature.md): what you paid, what Livo holds safely
 * until you confirm (BR-08), what was refunded; every payment in plain words; invoices. View and page in the URL.
 */
export function PaymentsHistory() {
  const { query, hrefWith } = useUrlQuery(customerPaymentQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useMyPayments(query)
  const tabs = [
    { id: undefined, key: "payments", label: "Payments" },
    { id: "invoices", key: "invoices", label: "Invoices", count: data?.invoiceCount },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments and invoices"
        description="Online payments are held safely by Livo and only reach the provider after you confirm the job is done."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your payments" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Paid" value={formatPrice(data.totals.paid)} icon={Wallet} hint="Online and cash, all time" />
            <StatCard label="Held safely by Livo" value={formatPrice(data.totals.held)} icon={Lock} hint="Released after you confirm the job" />
            <StatCard label="Refunded to you" value={formatPrice(data.totals.refunded)} icon={RotateCcw} />
          </section>

          <nav aria-label="Show" className="flex gap-1 border-b">
            {tabs.map((t) => {
              const active = query.view === t.key
              return (
                <Link
                  key={t.key}
                  href={hrefWith({ view: t.id })}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn("-mb-px flex h-12 items-center gap-2 border-b-2 px-4 text-base", active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
                >
                  {t.label}
                  {"count" in t && t.count !== undefined ? <span className={cn("rounded-full px-2 text-sm tabular-nums", active ? "bg-primary/12 text-primary" : "bg-muted")}>{formatNumber(t.count)}</span> : null}
                </Link>
              )
            })}
          </nav>

          <Card>
            <CardContent>
              {data.view === "payments" && data.payments ? (
                data.payments.items.length === 0 ? (
                  <EmptyState icon={CreditCard} title="No payments yet" description="Payments for your bookings appear here." />
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Booking</TableHead>
                          <TableHead>How</TableHead>
                          <TableHead className="text-end">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.payments.items.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm whitespace-nowrap tabular-nums">{formatZonedDateTime(p.date)}</TableCell>
                            <TableCell className="max-w-64 whitespace-normal">
                              <Link href={`/account/bookings/${p.booking.id}`} className="font-medium hover:underline">
                                {p.booking.title}
                              </Link>
                              <span className="block text-xs text-muted-foreground tabular-nums">
                                {p.booking.number}
                                {p.milestone ? ` · ${p.milestone}` : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{PAYMENT_METHOD_LABEL[p.method]}</TableCell>
                            <TableCell className="text-end tabular-nums">
                              <bdi dir="ltr" className="font-semibold">{formatPrice(p.amount)}</bdi>
                              {p.refundedAmount > 0 ? (
                                <span className="block text-xs text-success">
                                  refunded <bdi dir="ltr">{formatPrice(p.refundedAmount)}</bdi>
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="max-w-56 whitespace-normal">
                              <MetaBadge meta={PAYMENT_STATUS[p.status]} />
                              <span className="mt-1 block text-xs text-muted-foreground">{p.label}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ListPagination page={data.payments.page} pageCount={data.payments.pageCount} total={data.payments.total} hrefFor={(page) => hrefWith({ page })} />
                  </>
                )
              ) : data.invoices ? (
                data.invoices.items.length === 0 ? (
                  <EmptyState icon={FileText} title="No invoices yet" description="An invoice is issued for every finished job." />
                ) : (
                  <>
                    <ul className="divide-y">
                      {data.invoices.items.map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                          <FileText className="size-5 text-muted-foreground" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium tabular-nums">{i.number}</span>
                            <Link href={`/account/bookings/${i.booking.id}`} className="block text-sm text-muted-foreground hover:underline">
                              {i.booking.title} · {i.booking.number}
                            </Link>
                          </span>
                          <span className="text-sm text-muted-foreground tabular-nums">{formatZonedDateTime(i.issuedAt)}</span>
                          <bdi dir="ltr" className="w-28 text-end font-semibold tabular-nums">{formatPrice(i.total)}</bdi>
                          <Button size="sm" variant="outline" disabled title="PDF invoices are coming soon">
                            PDF soon
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <ListPagination page={data.invoices.page} pageCount={data.invoices.pageCount} total={data.invoices.total} hrefFor={(page) => hrefWith({ page })} />
                  </>
                )
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
