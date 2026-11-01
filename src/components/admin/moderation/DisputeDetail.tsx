"use client"

import Link from "next/link"
import { CheckCircle2, Eye, FileText, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { ChatTranscript } from "@/components/admin/shared/ChatTranscript"
import { DetailField } from "@/components/admin/shared/DetailField"
import { HistoryCard } from "@/components/admin/shared/HistoryCard"
import { BookingStatusBadge, DisputeStatusBadge, MetaBadge, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ESCROW_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS, RESOLUTION_LABEL } from "@/constants/status"
import { useAdminDispute, useStartDisputeReview } from "@/hooks/use-admin-moderation"
import type { AdminDisputeDetail } from "@/types/admin"
import { formatDate, formatDateTime, formatPrice } from "@/utils/format"
import { ResolveDisputeForm } from "./ResolveDisputeForm"

/**
 * `/admin/disputes/[id]` (AD-05): the complaint, evidence (admin-only signed
 * links), the booking and its money, the chat, history, and the decision.
 */
export function DisputeDetail({ initialData }: { initialData: AdminDisputeDetail }) {
  const { data: d } = useAdminDispute(initialData.id, initialData)
  const startReview = useStartDisputeReview()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dispute on ${d.bookingNumber}`}
        description={`Opened by ${d.openedByName} (${d.openedBySide === "PROVIDER" ? "provider" : "customer"}) on ${formatDate(d.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DisputeStatusBadge status={d.status} />
            {d.status === "OPEN" ? (
              <Button
                variant="outline"
                disabled={startReview.isPending}
                onClick={() =>
                  startReview.mutate(d.id, {
                    onSuccess: () => toast.success("You're reviewing this dispute"),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                {startReview.isPending ? <Spinner data-icon="inline-start" /> : <Eye data-icon="inline-start" aria-hidden />}
                Start review
              </Button>
            ) : null}
          </div>
        }
      />

      {d.status === "RESOLVED" && d.resolution ? (
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <AlertTitle>
            {RESOLUTION_LABEL[d.resolution]}
            {d.refundAmount ? ` — ${formatPrice(d.refundAmount)} refunded` : ""}
          </AlertTitle>
          <AlertDescription>
            {d.resolutionNote ? `“${d.resolutionNote}”` : null}
            {d.resolvedBy || d.resolvedAt ? ` — ${d.resolvedBy ?? "an admin"}${d.resolvedAt ? `, ${formatDateTime(d.resolvedAt)}` : ""}` : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complaint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line" dir="auto">
                {d.reason}
              </p>
              {d.evidence.length ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Evidence</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {d.evidence.map((f, i) => (
                      <li key={f.id}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
                          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            {f.mimeType === "application/pdf" ? <FileText className="size-4" aria-hidden /> : <ImageIcon className="size-4" aria-hidden />}
                          </span>
                          <span className="text-sm">
                            File {i + 1}
                            <span className="block text-xs text-muted-foreground">{formatDate(f.createdAt)}</span>
                          </span>
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No evidence files attached.</p>
              )}
            </CardContent>
          </Card>

          {d.status !== "RESOLVED" ? <ResolveDisputeForm dispute={d} /> : null}

          <ChatTranscript messages={d.messages} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking</CardTitle>
              <CardDescription>{d.booking.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <DetailField label="Booking">
                  <span className="flex items-center gap-2">
                    <Link href={`/admin/bookings/${d.bookingId}`} className="text-primary tabular-nums hover:underline">
                      {d.bookingNumber}
                    </Link>
                    <BookingStatusBadge status={d.booking.status} />
                  </span>
                </DetailField>
                <DetailField label="Customer">
                  <Link href={`/admin/users/${d.customerId}`} className="text-primary hover:underline">
                    {d.customerName}
                  </Link>
                </DetailField>
                <DetailField label="Provider">
                  <Link href={`/admin/providers/${d.providerId}`} className="text-primary hover:underline">
                    {d.providerName}
                  </Link>
                </DetailField>
                <DetailField label="Amount">
                  <bdi dir="ltr">{formatPrice(d.amount)}</bdi>
                  <span className="text-sm text-muted-foreground"> · {d.booking.commissionRate}% commission</span>
                </DetailField>
                <DetailField label="Scheduled">{d.booking.scheduledAt ? formatDateTime(d.booking.scheduledAt) : "—"}</DetailField>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Money</CardTitle>
              <CardDescription>
                {d.held > 0 ? `${formatPrice(d.held)} is held by Livo.` : "Nothing is held by Livo."} Provider credited so far:{" "}
                {formatPrice(d.walletCreditedSoFar)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {d.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments.</p>
              ) : (
                <ul className="space-y-2">
                  {d.payments.map((p) => (
                    <li key={p.id} className="space-y-1 rounded-md border p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {PAYMENT_METHOD_LABEL[p.method]}
                          {p.milestone ? <span className="text-muted-foreground"> · {p.milestone}</span> : null}
                        </span>
                        <bdi dir="ltr" className="tabular-nums">
                          {formatPrice(p.amount)}
                        </bdi>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <MetaBadge meta={PAYMENT_STATUS[p.status]} />
                        {ESCROW_LABEL[p.escrowState]}
                        {p.refundedAmount > 0 ? <span>· refunded {formatPrice(p.refundedAmount)}</span> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <HistoryCard entries={d.history} />
        </div>
      </div>
    </div>
  )
}
