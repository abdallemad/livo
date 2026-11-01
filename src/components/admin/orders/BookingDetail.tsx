"use client"

import Link from "next/link"
import { AlertTriangle, Ban, Lock, LockOpen, MessageSquare, ShieldAlert, Star } from "lucide-react"
import { toast } from "sonner"
import { DetailField } from "@/components/admin/shared/DetailField"
import { HistoryCard } from "@/components/admin/shared/HistoryCard"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { BookingStatusBadge, DisputeStatusBadge, MetaBadge, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ESCROW_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/constants/status"
import { useAdminBooking, useCancelBooking } from "@/hooks/use-admin-orders"
import { cn } from "@/lib/utils"
import type { AdminBookingDetail } from "@/types/admin"
import { formatDateTime, formatNumber, formatPrice } from "@/utils/format"

const MILESTONE_LABEL = { PENDING: "Not funded", FUNDED: "Funded (held)", RELEASED: "Released", REFUNDED: "Refunded" } as const

/**
 * `/admin/bookings/[id]` (AD-04): parties, money snapshot (BR-01), payments
 * and escrow (BR-08), milestones (CU-17), timeline, the chat (read-only, for
 * disputes; blocked contact attempts flagged — SY-04), reviews, dispute,
 * history, and cancel while nothing has been paid.
 */
export function BookingDetail({ initialData }: { initialData: AdminBookingDetail }) {
  const { data: b } = useAdminBooking(initialData.id, initialData)
  const cancel = useCancelBooking()
  const open = b.status !== "CANCELLED" && b.status !== "REJECTED"

  const cancelButton = (
    <Button variant="destructive" disabled={!b.canCancel || cancel.isPending}>
      <Ban data-icon="inline-start" aria-hidden />
      Cancel booking
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Booking ${b.number}`}
        description={`${b.source === "SERVICE" ? "Fixed-price service" : "Accepted quote"} · ${b.title}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={b.status} />
            {open ? (
              b.canCancel ? (
                <ReasonDialog
                  trigger={cancelButton}
                  title={`Cancel booking ${b.number}?`}
                  description="Nothing has been paid yet, so no refund is needed. The customer and the provider both see your reason."
                  confirmLabel="Cancel booking"
                  pending={cancel.isPending}
                  onSubmit={(reason) => cancel.mutateAsync({ id: b.id, reason }).then(() => toast.success(`Booking ${b.number} was cancelled`))}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger render={<span tabIndex={0} />}>{cancelButton}</TooltipTrigger>
                  <TooltipContent className="max-w-64">{b.cancelBlockedReason}</TooltipContent>
                </Tooltip>
              )
            ) : null}
          </div>
        }
      />

      {b.status === "CANCELLED" || b.status === "REJECTED" ? (
        <Alert variant="destructive">
          <Ban aria-hidden />
          <AlertTitle>{b.status === "CANCELLED" ? "Cancelled" : "Declined by the provider"}</AlertTitle>
          <AlertDescription>
            {b.cancelReason ? `“${b.cancelReason}”` : "No reason recorded."}
            {b.cancelledBy ? ` — ${b.cancelledBy}` : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {b.dispute ? (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle className="flex items-center gap-2">
            Dispute <DisputeStatusBadge status={b.dispute.status} />
          </AlertTitle>
          <AlertDescription>
            “{b.dispute.reason}”{" "}
            <Link href={`/admin/disputes/${b.dispute.id}`} className="underline">
              Open the dispute
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailField label="Customer">
                  <Link href={`/admin/users/${b.customerId}`} className="text-primary hover:underline">
                    {b.customerName}
                  </Link>
                </DetailField>
                <DetailField label="Provider">
                  <Link href={`/admin/providers/${b.providerId}`} className="text-primary hover:underline">
                    {b.providerName}
                  </Link>
                </DetailField>
                <DetailField label="Scheduled">{b.scheduledAt ? formatDateTime(b.scheduledAt) : "Not scheduled"}</DetailField>
                <DetailField label="Contact details">
                  <span className="flex items-center gap-1.5">
                    {b.contactUnlocked ? <LockOpen className="size-4 text-success" aria-hidden /> : <Lock className="size-4 text-muted-foreground" aria-hidden />}
                    {b.contactUnlocked ? "Shared with each other" : "Still hidden (not confirmed)"}
                  </span>
                </DetailField>
                <DetailField label="Address" className="sm:col-span-2">
                  {b.address ?? "—"}
                </DetailField>
                {b.requestId ? (
                  <DetailField label="From request">
                    <Link href={`/admin/requests/${b.requestId}`} className="text-primary hover:underline">
                      View the request and quotes
                    </Link>
                  </DetailField>
                ) : null}
                {b.notes ? (
                  <DetailField label="Customer notes" className="sm:col-span-2">
                    <span className="whitespace-pre-line">{b.notes}</span>
                  </DetailField>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments</CardTitle>
              <CardDescription>Online payments stay held by Livo until the customer confirms or the objection window ends.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {b.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-end">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Escrow</TableHead>
                      <TableHead>Dates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {PAYMENT_METHOD_LABEL[p.method]}
                          {p.milestone ? <span className="block text-xs text-muted-foreground">{p.milestone}</span> : null}
                          {p.gatewayRef ? <code className="block text-xs text-muted-foreground">{p.gatewayRef}</code> : null}
                        </TableCell>
                        <TableCell className="text-end tabular-nums">
                          <bdi dir="ltr">{formatPrice(p.amount)}</bdi>
                          {p.refundedAmount > 0 ? (
                            <span className="block text-xs text-warning">
                              refunded <bdi dir="ltr">{formatPrice(p.refundedAmount)}</bdi>
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <MetaBadge meta={PAYMENT_STATUS[p.status]} />
                        </TableCell>
                        <TableCell className="text-sm">{ESCROW_LABEL[p.escrowState]}</TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {p.paidAt ? <span className="block">paid {formatDateTime(p.paidAt)}</span> : null}
                          {p.releasedAt ? <span className="block">released {formatDateTime(p.releasedAt)}</span> : null}
                          {!p.paidAt && !p.releasedAt ? formatDateTime(p.createdAt) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {b.milestones.length ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Milestones</h3>
                  <ol className="space-y-1.5">
                    {b.milestones.map((m, i) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                        <span>
                          {i + 1}. {m.title}
                          {m.dueAt ? <span className="ms-2 text-xs text-muted-foreground">due {formatDateTime(m.dueAt)}</span> : null}
                        </span>
                        <span className="flex items-center gap-2">
                          <bdi dir="ltr" className="tabular-nums">
                            {formatPrice(m.amount)}
                          </bdi>
                          <Badge variant={m.status === "RELEASED" ? "success" : m.status === "FUNDED" ? "info" : m.status === "REFUNDED" ? "warning" : "neutral"}>
                            {MILESTONE_LABEL[m.status]}
                          </Badge>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chat</CardTitle>
              <CardDescription>Read-only. Shown so the team can settle disputes.</CardDescription>
            </CardHeader>
            <CardContent>
              {b.messages.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="size-4" aria-hidden />
                  No messages.
                </p>
              ) : (
                <ol className="space-y-3">
                  {b.messages.map((m) => (
                    <li key={m.id} className={cn("flex", m.senderSide === "PROVIDER" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl border px-3 py-2",
                          m.senderSide === "PROVIDER" ? "bg-primary/5" : "bg-card",
                          m.contactBlocked && "border-warning/50",
                        )}
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {m.senderName} · {m.senderSide === "CUSTOMER" ? "customer" : m.senderSide === "PROVIDER" ? "provider" : "other"}
                        </p>
                        <p className="whitespace-pre-wrap" dir="auto">
                          {m.body}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="tabular-nums">{formatDateTime(m.createdAt)}</span>
                          {m.contactBlocked ? (
                            <span className="flex items-center gap-1 text-warning">
                              <ShieldAlert className="size-3.5" aria-hidden />
                              Contact details blocked
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Money</CardTitle>
              <CardDescription>Frozen when the booking was made.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <MoneyRow label="Booking amount" value={b.amount} />
                <MoneyRow label={`Livo commission (${formatNumber(b.commissionRate)}%)`} value={-b.commissionAmount} />
                <div className="border-t pt-2">
                  <MoneyRow label="Provider gets" value={b.providerNet} strong />
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {b.events.map((e) => (
                  <li key={e.key} className={cn("border-s-2 ps-3", e.upcoming ? "border-dashed" : "border-primary/50")}>
                    <p className="text-sm font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {e.upcoming ? "by " : ""}
                      {formatDateTime(e.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {b.reviews.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {b.reviews.map((r) => (
                  <div key={r.id} className="space-y-1">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-commit text-commit" : "text-muted-foreground")} aria-hidden />
                        ))}
                      </span>
                      <span className="text-muted-foreground">by the {r.byProvider ? "provider" : "customer"}</span>
                      {r.isHidden ? <Badge variant="neutral">Hidden</Badge> : null}
                    </p>
                    {r.comment ? (
                      <p className="text-sm" dir="auto">
                        {r.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <HistoryCard entries={b.history} />
        </div>
      </div>
    </div>
  )
}

function MoneyRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", strong && "font-semibold")}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">
        <bdi dir="ltr">{value < 0 ? `− ${formatPrice(-value)}` : formatPrice(value)}</bdi>
      </dd>
    </div>
  )
}
