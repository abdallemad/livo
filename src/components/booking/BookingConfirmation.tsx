"use client"

import Link from "next/link"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { BookingStatusBadge, PageHeader, PriceTag, Stepper } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBookingConfirmation } from "@/hooks/use-booking"
import { BOOKING_STEPS } from "@/utils/booking-checkout"
import { customerNextStep } from "@/utils/customer-booking"
import { formatZonedDateTime } from "@/utils/zoned-time"
import { PayNowButton } from "./PayNowButton"

/**
 * The wizard's last step (docs/booking-checkout-feature.md). After Stripe's redirect (`?checkout=success`) it polls
 * until the payment settles — the webhook is the fact, so "paid" is only shown once the server says so. A cancelled
 * checkout (`?checkout=cancelled`) keeps the booking unpaid and offers to pay again.
 */
export function BookingConfirmation({ bookingId, checkout }: { bookingId: string; checkout: "success" | "cancelled" | null }) {
  const query = useBookingConfirmation(bookingId, checkout === "success")
  const b = query.data

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>We couldn&apos;t load this booking</AlertTitle>
        <AlertDescription>{query.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (!b) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const unpaid = b.status === "PENDING_PAYMENT"
  const settling = query.stillSettling
  const done = !unpaid && b.status !== "CANCELLED" && b.status !== "REJECTED"

  return (
    <div className="space-y-6">
      <PageHeader title={done ? "Booking sent" : unpaid ? "Finish your payment" : "Booking closed"} description={`${b.title} with ${b.providerName}`} />
      <Stepper steps={BOOKING_STEPS} current={done ? 4 : 3} />

      {settling ? (
        <Alert>
          <Clock aria-hidden />
          <AlertTitle>Confirming your payment…</AlertTitle>
          <AlertDescription>This usually takes a few seconds. You can keep this page open.</AlertDescription>
        </Alert>
      ) : unpaid ? (
        <Alert>
          <XCircle aria-hidden />
          <AlertTitle>{checkout === "cancelled" ? "Payment cancelled" : "Not paid yet"}</AlertTitle>
          <AlertDescription>
            Your booking is saved but the provider won&apos;t see it until it&apos;s paid. {checkout === "success" ? "If you were charged, it will show here shortly." : ""}
          </AlertDescription>
        </Alert>
      ) : done ? (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertTitle>{b.payment?.method === "ONLINE" ? "Paid — Livo holds it until you confirm the job" : "Booked — pay in cash after the job"}</AlertTitle>
          <AlertDescription>{customerNextStep(b.status)}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Booking</p>
              <p className="font-semibold tabular-nums">
                <bdi dir="ltr">{b.number}</bdi>
              </p>
            </div>
            <BookingStatusBadge status={b.status} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">When</dt>
              <dd>{b.scheduledAt ? formatZonedDateTime(b.scheduledAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Where</dt>
              <dd>{b.place ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment</dt>
              <dd>{b.payment ? (b.payment.method === "ONLINE" ? "Online (card)" : "Cash after the job") : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd>
                <PriceTag amount={b.amount} size="sm" />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {b.canPay && !settling ? <PayNowButton bookingId={b.id} label={checkout === "cancelled" ? "Try paying again" : "Pay now"} /> : null}
        <Button variant={b.canPay ? "outline" : "default"} render={<Link href="/account/bookings" />}>
          My bookings
        </Button>
      </div>
    </div>
  )
}
