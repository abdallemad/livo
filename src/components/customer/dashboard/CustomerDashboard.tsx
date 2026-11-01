"use client"

import Link from "next/link"
import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardList, CreditCard, MessageSquareQuote, Plus, Star } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { BookingStatusBadge, EmptyState, PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCustomerDashboard } from "@/hooks/use-customer"
import type { AttentionKind, CustomerDashboardDto } from "@/types/customer"
import { formatNumber, formatPrice } from "@/utils/format"
import { formatZonedDay, formatZonedTime } from "@/utils/zoned-time"
import { MyRequestCard } from "../requests/MyRequestCard"

const ATTENTION: Record<AttentionKind, { icon: LucideIcon; action: string }> = {
  CONFIRM_DONE: { icon: CheckCircle2, action: "Confirm or report" },
  PAY: { icon: CreditCard, action: "Finish payment" },
  COMPARE_QUOTES: { icon: MessageSquareQuote, action: "Compare quotes" },
  REVIEW: { icon: Star, action: "Leave a review" },
}

function StatLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&>*]:h-full [&>*]:hover:bg-accent/40">
      {children}
    </Link>
  )
}

/**
 * `/account` (CU-08; docs/customer-dashboard-requests-feature.md): what needs the customer now (confirm a
 * finished job before the deadline, finish a payment, compare quotes, review a provider), then upcoming
 * bookings and open requests. First snapshot from the server; refetches from `GET /api/me/dashboard`.
 */
export function CustomerDashboard({ initialData }: { initialData: CustomerDashboardDto }) {
  const { data } = useCustomerDashboard(initialData)
  const { stats } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name ? `Welcome, ${data.name}` : "Welcome"}
        description="Your bookings, your requests, and what needs you."
        actions={
          <>
            <Button variant="outline" render={<Link href="/services" />}>
              Browse services
            </Button>
            <Button render={<Link href="/account/requests/new" />}>
              <Plus data-icon="inline-start" aria-hidden />
              Request a quote
            </Button>
          </>
        }
      />

      <section aria-label="Your numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatLink href="/account/bookings">
          <StatCard label="Upcoming bookings" value={formatNumber(stats.upcomingBookings)} icon={CalendarCheck} />
        </StatLink>
        <StatLink href="/account/requests">
          <StatCard label="Open requests" value={formatNumber(stats.openRequests)} icon={ClipboardList} />
        </StatLink>
        <StatLink href="/account/requests">
          <StatCard label="Quotes waiting" value={formatNumber(stats.quotesWaiting)} icon={MessageSquareQuote} hint="For you to compare" />
        </StatLink>
        <StatLink href="/account/bookings">
          <StatCard label="To review" value={formatNumber(stats.toReview)} icon={Star} hint="Finished jobs in the last 30 days" />
        </StatLink>
      </section>

      {data.attention.length ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Needs your attention</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.attention.map((a) => {
                const { icon: Icon, action } = ATTENTION[a.kind]
                return (
                  <li key={`${a.kind}-${a.id}`}>
                    <Link href={a.href} className="flex min-h-16 items-center gap-3 py-3 hover:bg-accent/40">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{a.title}</span>
                        <span className="block text-sm text-muted-foreground">{a.detail}</span>
                      </span>
                      <span className="hidden items-center gap-1 text-sm font-medium text-primary sm:flex">
                        {action}
                        <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming bookings</CardTitle>
            <CardDescription>Soonest first, Cairo time.</CardDescription>
            <CardAction>
              <Button variant="ghost" render={<Link href="/account/bookings" />}>
                All bookings
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming bookings"
                description="Book a fixed-price service and it shows up here with its date."
                action={<Button variant="outline" render={<Link href="/services" />}>Browse services</Button>}
              />
            ) : (
              <ul className="divide-y">
                {data.upcoming.map((b) => (
                  <li key={b.id}>
                    <Link href={`/account/bookings/${b.id}`} className="flex min-h-16 items-start gap-3 py-3 hover:bg-accent/40">
                      <span className="w-24 shrink-0 tabular-nums">
                        {b.scheduledAt ? (
                          <>
                            <span className="block font-heading font-semibold">{formatZonedTime(b.scheduledAt)}</span>
                            <span className="block text-xs text-muted-foreground">{formatZonedDay(b.scheduledAt)}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Time to agree</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{b.title}</span>
                        <span className="block text-sm text-muted-foreground">
                          {b.providerName} · <bdi dir="ltr">{formatPrice(b.amount)}</bdi>
                        </span>
                      </span>
                      <BookingStatusBadge status={b.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open requests</CardTitle>
            <CardDescription>Jobs waiting for quotes or for your choice.</CardDescription>
            <CardAction>
              <Button variant="ghost" render={<Link href="/account/requests" />}>
                All requests
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.openRequests.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No open requests"
                description="Request a quote for your project and compare the offers."
                action={<Button variant="outline" render={<Link href="/account/requests/new" />}>Request a quote</Button>}
              />
            ) : (
              data.openRequests.map((r) => <MyRequestCard key={r.id} r={r} compact />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
