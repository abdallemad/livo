"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2, Circle, Clock, Hourglass, Inbox, MapPin, ShieldCheck, Star, Wallet } from "lucide-react"
import { BookingStatusBadge, EmptyState, MetaBadge, PageHeader, StatCard } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PROVIDER_STATUS } from "@/constants/status"
import { useProviderDashboard } from "@/hooks/use-provider-workspace"
import { cn } from "@/lib/utils"
import type { ProviderDashboardDto } from "@/types/provider"
import { formatNumber, formatPrice } from "@/utils/format"
import { formatZonedTime } from "@/utils/zoned-time"
import { RequestCard } from "../requests/RequestCard"

const VERIFICATION_COPY: Record<string, string> = {
  DRAFT: "Finish your profile and send your documents so we can review your account.",
  PENDING: "We're reviewing your details. You'll start receiving requests once your account is active.",
  REJECTED: "Your account wasn't approved yet. Fix what we asked for and send your documents again.",
  SUSPENDED: "Your account is suspended, so you can't receive new requests. Contact support to find out why.",
}

function StatLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&>*]:h-full [&>*]:hover:bg-accent/40">
      {children}
    </Link>
  )
}

function SetupChecklist({ setup }: { setup: ProviderDashboardDto["setup"] }) {
  const steps = [
    { done: setup.hasCategories, label: "Choose your specialties", href: "/provider/settings" },
    { done: setup.hasAreas, label: "Choose the areas you work in", href: "/provider/settings" },
    { done: setup.hasServices, label: "Add a fixed-price service customers can book directly", href: "/provider/services/new" },
  ]
  if (steps.every((s) => s.done)) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Get more work</CardTitle>
        <CardDescription>Customers can only find you once these are done.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {steps.map((s) => (
            <li key={s.label}>
              {s.done ? (
                <span className="flex min-h-12 items-center gap-3 text-muted-foreground line-through">
                  <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
                  {s.label}
                </span>
              ) : (
                <Link href={s.href} className="flex min-h-12 items-center gap-3 font-medium hover:underline">
                  <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="flex-1">{s.label}</span>
                  <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/**
 * `/provider` home (PR-14, PR-03; docs/provider-dashboard-requests-feature.md). Providers are
 * mostly non-technical and on phones (NF-06): account status first if it blocks work, four
 * numbers, then the two lists that matter today — new requests and today's bookings — each with
 * one clear next step. First snapshot from the server; refetches from `GET /api/provider/dashboard`.
 */
export function ProviderDashboard({ initialData }: { initialData: ProviderDashboardDto }) {
  const { data } = useProviderDashboard(initialData)
  const { stats } = data
  const first = (data.name ?? "").trim().split(/\s+/)[0]
  const approved = data.eligibility === "OK"

  if (data.eligibility === "NO_PROFILE") {
    return (
      <div className="space-y-6">
        <PageHeader title="Provider dashboard" />
        <EmptyState icon={ShieldCheck} title="No provider profile" description="This account isn't a provider, so there's no provider data to show." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={first ? `Welcome, ${first}` : "Welcome"}
        description={approved ? "New requests in your area and today's bookings." : "Here's where your account stands."}
        actions={
          approved ? (
            <Button size="lg" render={<Link href="/provider/requests" />}>
              <Inbox data-icon="inline-start" aria-hidden />
              See available requests
            </Button>
          ) : null
        }
      />

      {data.verification && !approved ? (
        <Alert variant={data.verification.status === "PENDING" || data.verification.status === "DRAFT" ? "warning" : "destructive"}>
          <ShieldCheck aria-hidden />
          <AlertTitle className="flex flex-wrap items-center gap-2">
            Account status <MetaBadge meta={PROVIDER_STATUS[data.verification.status]} />
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{VERIFICATION_COPY[data.verification.status]}</p>
            {data.verification.status === "REJECTED" && data.verification.rejectionReason ? (
              <p>
                <span className="font-medium">Reason:</span> {data.verification.rejectionReason}
              </p>
            ) : null}
            <Button size="sm" variant="outline" render={<Link href="/provider/verification" />}>
              Go to verification
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {stats.underReview ? (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>Your profile is under review because of low ratings</AlertTitle>
          <AlertDescription>Our team is looking at your recent reviews. Keep your appointments and talk to customers through the chat.</AlertDescription>
        </Alert>
      ) : null}

      <section aria-label="Your numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatLink href="/provider/requests">
          <StatCard
            label="New requests"
            value={formatNumber(stats.newRequests)}
            icon={Inbox}
            hint={stats.pendingQuotes ? `${formatNumber(stats.pendingQuotes)} of your quotes waiting` : "In your specialty and areas"}
          />
        </StatLink>
        <StatLink href="/provider/bookings">
          <StatCard
            label="Bookings to accept"
            value={formatNumber(stats.bookingsToAccept)}
            icon={Hourglass}
            hint={`${formatNumber(stats.activeBookings)} confirmed or in progress`}
            className={cn(stats.bookingsToAccept > 0 && "border-warning/40 bg-warning/5")}
          />
        </StatLink>
        <StatLink href="/provider/earnings">
          <StatCard
            label="Earned this month"
            value={formatPrice(stats.earningsThisMonth)}
            icon={Wallet}
            hint={`Wallet balance ${formatPrice(stats.walletBalance)}`}
          />
        </StatLink>
        <StatLink href="/provider/reviews">
          <StatCard
            label="Rating"
            value={stats.ratingCount ? formatNumber(stats.ratingAvg) : "—"}
            icon={Star}
            hint={`${stats.ratingCount ? `${formatNumber(stats.ratingCount)} reviews · ` : "No reviews yet · "}${formatNumber(stats.completedJobs)} jobs done`}
          />
        </StatLink>
      </section>

      <SetupChecklist setup={data.setup} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New requests for you</CardTitle>
            <CardDescription>Newest first, in your specialty and areas.</CardDescription>
            {stats.newRequests > data.newRequests.length ? (
              <CardAction>
                <Button variant="ghost" render={<Link href="/provider/requests" />}>
                  See all {formatNumber(stats.newRequests)}
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {!approved ? (
              <EmptyState icon={ShieldCheck} title="Requests appear once your account is active" />
            ) : data.newRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No new requests right now"
                description="We'll notify you as soon as a customer asks for work in your specialty and area."
                action={
                  <Button variant="outline" render={<Link href="/provider/requests?scope=city" />}>
                    Look across the whole city
                  </Button>
                }
              />
            ) : (
              data.newRequests.map((r) => <RequestCard key={r.id} r={r} compact />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s bookings</CardTitle>
            <CardDescription>Your appointments for today, Cairo time.</CardDescription>
            <CardAction>
              <Button variant="ghost" render={<Link href="/provider/bookings" />}>
                All bookings
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.todayBookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No bookings today"
                description={data.setup.hasServices ? "New bookings show up here on their day." : "Add a fixed-price service so customers can book you right away."}
                action={
                  data.setup.hasServices ? undefined : (
                    <Button variant="outline" render={<Link href="/provider/services/new" />}>
                      Add a service
                    </Button>
                  )
                }
              />
            ) : (
              <ul className="divide-y">
                {data.todayBookings.map((b) => (
                  <li key={b.id}>
                    <Link href={`/provider/bookings/${b.id}`} className="flex min-h-16 items-start gap-3 py-3 hover:bg-accent/40">
                      <span className="flex w-20 shrink-0 items-center gap-1 pt-0.5 font-heading font-semibold tabular-nums">
                        <Clock className="size-4 text-muted-foreground" aria-hidden />
                        <bdi dir="ltr">{formatZonedTime(b.scheduledAt)}</bdi>
                      </span>
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="block font-medium">{b.title}</span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {b.customerFirstName ? <span>{b.customerFirstName}</span> : null}
                          {b.place ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" aria-hidden />
                              {b.place}
                            </span>
                          ) : null}
                          <span className="tabular-nums">{b.number}</span>
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
      </div>
    </div>
  )
}
