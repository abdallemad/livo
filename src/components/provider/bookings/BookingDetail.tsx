"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, Lock, MessageSquare, Phone } from "lucide-react"
import { DetailField } from "@/components/admin/shared/DetailField"
import { BookingStatusBadge, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProviderBooking } from "@/hooks/use-provider-workspace"
import { cn } from "@/lib/utils"
import type { ProviderBookingDetail } from "@/types/provider"
import { formatNumber, formatPhone, formatPrice } from "@/utils/format"
import { formatZonedDateTime } from "@/utils/zoned-time"
import { BookingActions } from "./BookingActions"

/** What happens next, in one sentence, for each status the provider can see. */
function nextStep(b: ProviderBookingDetail): string | null {
  switch (b.status) {
    case "PENDING_PROVIDER":
      return "The customer is waiting for your answer. Accept to see their phone and full address."
    case "CONFIRMED":
      return "You're booked. Start the work when you arrive."
    case "IN_PROGRESS":
      return "Mark the job as done when you finish."
    case "AWAITING_CONFIRMATION":
      return b.autoReleaseAt
        ? `Waiting for the customer to confirm. If they don't report a problem by ${formatZonedDateTime(b.autoReleaseAt)}, the job counts as done.`
        : "Waiting for the customer to confirm the job is done."
    default:
      return null
  }
}

/**
 * `/provider/bookings/[id]` (PR-08, BR-02, BR-08; docs/provider-quotes-bookings-feature.md): the job,
 * when and where, the customer (first name and area until the provider accepts; then name, phone
 * and full address), the money (amount, commission, your share, payment state), the timeline and
 * the next action. First snapshot from the server; refetches after every action.
 */
export function BookingDetail({ initialData }: { initialData: ProviderBookingDetail }) {
  const { data: b } = useProviderBooking(initialData.id, initialData)
  const step = nextStep(b)
  const unlocked = b.contactUnlocked

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href="/provider/bookings" />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        My bookings
      </Button>

      <PageHeader title={b.title} description={`Booking ${b.number} · ${b.source === "SERVICE" ? "fixed-price service" : "from your quote"}`} actions={<BookingStatusBadge status={b.status} />} />

      {b.dispute ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>There&apos;s a dispute on this booking</AlertTitle>
          <AlertDescription>
            {b.dispute.reason} Our team is reviewing it and will contact you. The payment stays on hold until it&apos;s settled.
          </AlertDescription>
        </Alert>
      ) : null}

      {b.status === "REJECTED" || b.status === "CANCELLED" ? (
        <Alert variant="destructive">
          <AlertTitle>{b.status === "REJECTED" ? "You declined this booking" : b.cancelledBySelf ? "You cancelled this booking" : "This booking was cancelled"}</AlertTitle>
          {b.cancelReason ? <AlertDescription>Reason: {b.cancelReason}</AlertDescription> : null}
        </Alert>
      ) : null}

      {step || b.actions.length ? (
        <Card className="border-primary/30">
          <CardContent className="space-y-3">
            {step ? <p className="text-base font-medium">{step}</p> : null}
            <BookingActions booking={b} objectionWindowHours={b.objectionWindowHours} size="lg" />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">When and where</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <DetailField label="Appointment">
                <span className="text-lg font-semibold">{b.scheduledAt ? formatZonedDateTime(b.scheduledAt) : "To be agreed"}</span>
              </DetailField>
              <DetailField label="Address">
                {unlocked ? (
                  b.customer.address ?? "Not given"
                ) : (
                  <span className="flex items-center gap-1.5">
                    {b.place ?? "Area not given"}
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Lock className="size-3.5" aria-hidden />
                      full address after you accept
                    </span>
                  </span>
                )}
              </DetailField>
              {b.quote ? (
                <DetailField label="Your quote">
                  <bdi dir="ltr" className="tabular-nums">{formatPrice(b.quote.price)}</bdi>
                  {b.quote.durationDays ? ` · ${formatNumber(b.quote.durationDays)} days` : ""}
                </DetailField>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer</CardTitle>
            {!unlocked ? <CardDescription>Contact details are shared only after you accept the booking.</CardDescription> : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4">
              <DetailField label="Name">{unlocked ? (b.customer.fullName ?? b.customer.firstName ?? "—") : (b.customer.firstName ?? "—")}</DetailField>
              <DetailField label="Phone">
                {unlocked && b.customer.phone ? (
                  <a href={`tel:${b.customer.phone}`} className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                    <Phone className="size-4" aria-hidden />
                    <bdi dir="ltr" className="tabular-nums">{formatPhone(b.customer.phone)}</bdi>
                  </a>
                ) : unlocked ? (
                  "Not given"
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="size-3.5" aria-hidden />
                    Hidden until you accept
                  </span>
                )}
              </DetailField>
              {b.notes ? (
                <DetailField label="Notes from the customer">
                  <p className="whitespace-pre-line">{b.notes}</p>
                  {b.notesMasked ? <p className="mt-1 text-xs text-muted-foreground">Contact details in the notes are hidden until you accept.</p> : null}
                </DetailField>
              ) : null}
            </dl>
            {unlocked ? (
              <Button variant="outline" render={<Link href={`/provider/messages/${b.id}`} />}>
                <MessageSquare data-icon="inline-start" aria-hidden />
                Message the customer
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Money</CardTitle>
            <CardDescription>{b.paymentSummary}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 tabular-nums">
              <DetailField label="Customer pays">
                <bdi dir="ltr">{formatPrice(b.amount)}</bdi>
              </DetailField>
              <DetailField label={`Livo commission (${formatNumber(b.commissionRate)}%)`}>
                <bdi dir="ltr">− {formatPrice(b.commissionAmount)}</bdi>
              </DetailField>
              <DetailField label="You get" className="col-span-2">
                <bdi dir="ltr" className="text-2xl font-semibold">{formatPrice(b.providerNet)}</bdi>
              </DetailField>
            </dl>
            {b.paymentMethod === "CASH" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Cash job: you collect {formatPrice(b.amount)} from the customer; the {formatPrice(b.commissionAmount)} commission is taken from your wallet.
              </p>
            ) : null}
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
                    {formatZonedDateTime(e.at)}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
