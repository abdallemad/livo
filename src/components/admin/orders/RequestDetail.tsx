"use client"

import Link from "next/link"
import { XCircle } from "lucide-react"
import { toast } from "sonner"
import { DetailField } from "@/components/admin/shared/DetailField"
import { HistoryCard } from "@/components/admin/shared/HistoryCard"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { BookingStatusBadge, MetaBadge, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QUOTE_STATUS } from "@/constants/status"
import { useAdminRequest, useCancelRequest } from "@/hooks/use-admin-orders"
import type { AdminRequestDetail } from "@/types/admin"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import { requestStatusMeta } from "./RequestsTable"

/** `/admin/requests/[id]` (AD-04): the request, every quote on it, its booking, history, and closing it. */
export function RequestDetail({ initialData }: { initialData: AdminRequestDetail }) {
  const { data: r } = useAdminRequest(initialData.id, initialData)
  const cancel = useCancelRequest()
  const closable = r.status === "OPEN" || r.status === "DRAFT"

  return (
    <div className="space-y-6">
      <PageHeader
        title={r.title}
        description={`${r.category} · ${r.area ? `${r.area}, ` : ""}${r.city} · posted ${formatDate(r.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MetaBadge meta={requestStatusMeta(r)} />
            {closable ? (
              <ReasonDialog
                trigger={
                  <Button variant="destructive" disabled={cancel.isPending}>
                    <XCircle data-icon="inline-start" aria-hidden />
                    Close request
                  </Button>
                }
                title="Close this request?"
                description={`Providers can't quote on it any more${r.pendingQuoteCount ? ` and the ${r.pendingQuoteCount} waiting ${r.pendingQuoteCount === 1 ? "quote expires" : "quotes expire"}` : ""}. The customer${r.pendingQuoteCount ? " and those providers" : ""} see your reason.`}
                confirmLabel="Close request"
                pending={cancel.isPending}
                onSubmit={(reason) => cancel.mutateAsync({ id: r.id, reason }).then(() => toast.success("The request was closed"))}
              />
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailField label="Customer">
                  <Link href={`/admin/users/${r.customerId}`} className="text-primary hover:underline">
                    {r.customerName}
                  </Link>
                </DetailField>
                <DetailField label="Budget">{r.budget !== null ? <bdi dir="ltr">{formatPrice(r.budget)}</bdi> : "Not given"}</DetailField>
                <DetailField label="Preferred date">{r.preferredDate ? formatDate(r.preferredDate) : "Flexible"}</DetailField>
                <DetailField label={r.status === "EXPIRED" ? "Expired on" : "Expires"}>{r.expiresAt ? formatDate(r.expiresAt) : "—"}</DetailField>
                <DetailField label="Address">{r.address ?? (r.area ? `${r.area}, ${r.city}` : r.city)}</DetailField>
                <DetailField label="Photos / files">{formatNumber(r.mediaCount)}</DetailField>
                <DetailField label="Description" className="sm:col-span-2">
                  <span className="whitespace-pre-line">{r.description}</span>
                </DetailField>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quotes</CardTitle>
              <CardDescription>
                {r.quoteCount ? `${formatNumber(r.quoteCount)} received, oldest first` : "No provider has quoted yet."}
              </CardDescription>
            </CardHeader>
            {r.quotes.length ? (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-end">Price</TableHead>
                      <TableHead className="text-end">Days</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.quotes.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>
                          <Link href={`/admin/providers/${q.providerId}`} className="font-medium hover:underline">
                            {q.providerName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-end tabular-nums">
                          <bdi dir="ltr">{formatPrice(q.price)}</bdi>
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{q.durationDays ?? "—"}</TableCell>
                        <TableCell className="max-w-72 whitespace-normal text-sm text-muted-foreground">{q.message ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">{formatDate(q.createdAt)}</TableCell>
                        <TableCell>
                          <span className="flex flex-col items-start gap-1">
                            <MetaBadge meta={QUOTE_STATUS[q.status]} />
                            {q.bookingId ? (
                              <Link href={`/admin/bookings/${q.bookingId}`} className="text-xs text-primary hover:underline">
                                View booking
                              </Link>
                            ) : null}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          {r.bookings.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {r.bookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2">
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium tabular-nums hover:underline">
                        {b.number}
                      </Link>
                      <BookingStatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          <HistoryCard entries={r.history} />
        </div>
      </div>
    </div>
  )
}
