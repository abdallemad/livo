"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, Check, Lock, MessageSquare, Phone, ShieldCheck, Star } from "lucide-react"
import { DetailField } from "@/components/admin/shared/DetailField"
import { PayNowButton } from "@/components/booking/PayNowButton"
import { BookingStatusBadge, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMyBooking } from "@/hooks/use-customer-account"
import { cn } from "@/lib/utils"
import type { CustomerBookingDetail } from "@/types/customer-account"
import { bookingStages } from "@/utils/customer-booking-actions"
import { formatPhone, formatPrice } from "@/utils/format"
import { formatZonedDateTime } from "@/utils/zoned-time"
import { MyBookingActions } from "./MyBookingActions"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

const CLOSED_TITLE: Record<NonNullable<CustomerBookingDetail["closedBy"]>, string> = {
  YOU: "You cancelled this booking",
  PROVIDER: "The provider couldn't take this booking",
  LIVO: "Livo cancelled this booking",
}

/**
 * `/account/bookings/[id]` (CU-09…CU-12, BR-02, BR-08; docs/customer-booking-detail-feature.md): progress, the next step
 * with its actions (pay, confirm, cancel, review, report a problem), when and where, the provider (phone and chat only
 * once they accept), the money (what Livo holds, refunds) and the dated history. First snapshot from the server;
 * refetches after every action.
 */
export function MyBookingDetail({ initialData }: { initialData: CustomerBookingDetail }) {
  const { data: b } = useMyBooking(initialData.id, initialData)
  const stages = bookingStages(b.status, b.paymentMethod)
  const closed = b.status === "CANCELLED" || b.status === "REJECTED"
  const hasActions = b.canPay || b.actions.length > 0 || b.canReview || b.canReportProblem

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href="/account/bookings" />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        My bookings
      </Button>

      <PageHeader title={b.title} description={`Booking ${b.number} · ${b.source === "SERVICE" ? "fixed-price service" : "from a quote"}`} actions={<BookingStatusBadge status={b.status} />} />

      {stages ? (
        <ol aria-label="Booking progress" className="flex flex-wrap gap-x-2 gap-y-3">
          {stages.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2" aria-current={s.state === "current" ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums",
                  s.state === "done" && "border-primary bg-primary text-primary-foreground",
                  s.state === "current" && "border-primary text-primary",
                  s.state === "todo" && "border-border text-muted-foreground",
                )}
              >
                {s.state === "done" ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn("text-sm", s.state === "current" ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
              {i < stages.length - 1 ? <span aria-hidden className={cn("hidden h-0.5 w-6 rounded-full sm:block", s.state === "done" ? "bg-primary" : "bg-border")} /> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {b.dispute ? (
        <Alert variant={b.dispute.status === "RESOLVED" ? "default" : "destructive"}>
          <AlertTriangle aria-hidden />
          <AlertTitle>{b.dispute.status === "RESOLVED" ? "Your reported problem was settled" : "You reported a problem"}</AlertTitle>
          <AlertDescription>
            {b.dispute.reason} {b.dispute.status === "RESOLVED" ? "" : "Our team is looking into it; the payment stays on hold until it's settled."}
          </AlertDescription>
        </Alert>
      ) : null}

      {closed && b.closedBy ? (
        <Alert variant="destructive">
          <AlertTitle>{CLOSED_TITLE[b.closedBy]}</AlertTitle>
          <AlertDescription>
            {b.cancelReason ? `Reason: ${b.cancelReason} ` : ""}
            {b.refunded > 0 ? `${formatPrice(b.refunded)} is refunded to you.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-primary/30">
        <CardContent className="space-y-3">
          <p className="text-base font-medium">{b.nextStep}</p>
          {hasActions ? (
            <div className="flex flex-wrap gap-3">
              {b.canPay ? <PayNowButton bookingId={b.id} /> : null}
              <MyBookingActions booking={b} />
              {b.canReview ? (
                <Button size="lg" variant="outline" render={<Link href={`/account/bookings/${b.id}/review`} />}>
                  <Star data-icon="inline-start" aria-hidden />
                  Leave a review
                </Button>
              ) : null}
              {b.canReportProblem ? (
                <Button variant="ghost" render={<Link href={`/account/bookings/${b.id}/dispute`} />}>
                  <AlertTriangle data-icon="inline-start" aria-hidden />
                  Report a problem
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

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
              <DetailField label="Address">{b.place ?? "Not given"}</DetailField>
              {b.notes ? (
                <DetailField label="Your notes">
                  <p className="whitespace-pre-line">{b.notes}</p>
                </DetailField>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Provider</CardTitle>
            {!b.canMessage && !closed ? <CardDescription>Their phone number and chat open once they accept the booking.</CardDescription> : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/providers/${b.provider.id}`} className="flex items-center gap-3 hover:underline">
              <Avatar className="size-11">
                {b.provider.avatarUrl ? <AvatarImage src={b.provider.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials(b.provider.name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{b.provider.name}</span>
            </Link>
            <dl className="grid gap-4">
              <DetailField label="Phone">
                {b.provider.phone ? (
                  <a href={`tel:${b.provider.phone}`} className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                    <Phone className="size-4" aria-hidden />
                    <bdi dir="ltr" className="tabular-nums">{formatPhone(b.provider.phone)}</bdi>
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="size-3.5" aria-hidden />
                    {closed || b.status === "COMPLETED" || b.status === "CLOSED" ? "Not shared" : "Shared after they accept"}
                  </span>
                )}
              </DetailField>
            </dl>
            {b.canMessage ? (
              <Button variant="outline" render={<Link href={`/account/messages/${b.id}`} />}>
                <MessageSquare data-icon="inline-start" aria-hidden />
                Message the provider
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
            {b.paymentLabel ? <CardDescription>{b.paymentLabel}</CardDescription> : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 tabular-nums">
              <DetailField label="Total">
                <bdi dir="ltr" className="text-2xl font-semibold">{formatPrice(b.amount)}</bdi>
              </DetailField>
              {b.held > 0 ? (
                <DetailField label="Held safely by Livo">
                  <bdi dir="ltr">{formatPrice(b.held)}</bdi>
                </DetailField>
              ) : null}
              {b.refunded > 0 ? (
                <DetailField label="Refunded to you">
                  <bdi dir="ltr">{formatPrice(b.refunded)}</bdi>
                </DetailField>
              ) : null}
            </dl>
            {b.held > 0 ? (
              <p className="flex gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  The provider gets paid only after you confirm the job
                  {b.autoReleaseAt && b.status === "AWAITING_CONFIRMATION" ? `, or automatically after ${formatZonedDateTime(b.autoReleaseAt)} if you don't report a problem` : ""}.
                </span>
              </p>
            ) : null}
            {b.payments.length > 1 ? (
              <ul className="divide-y rounded-lg border text-sm">
                {b.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 p-3">
                    <span>
                      {p.method === "ONLINE" ? "Card" : "Cash"} · {p.label}
                    </span>
                    <bdi dir="ltr" className="tabular-nums">{formatPrice(p.amount)}</bdi>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">History</CardTitle>
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
