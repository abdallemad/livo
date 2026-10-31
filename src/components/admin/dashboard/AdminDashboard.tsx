"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarCheck,
  ClipboardList,
  Eye,
  Hourglass,
  Percent,
  Scale,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { BookingStatusBadge, DisputeStatusBadge, EmptyState, PageHeader, StatCard, VerificationBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminDashboard, useStartDisputeReview } from "@/hooks/use-admin-dashboard"
import { cn } from "@/lib/utils"
import type { AdminDashboardDto } from "@/types/admin"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import { ProviderDecisionActions } from "@/components/admin/providers/ProviderDecisionActions"

/**
 * `/admin` body (AD-09, docs/admin-dashboard-feature.md). The server page
 * passes the first snapshot as `initialData`; approve / reject / start-review
 * invalidate the query, so KPIs and queues refresh in place after each action.
 */
export function AdminDashboard({ initialData }: { initialData: AdminDashboardDto }) {
  const { data, isFetching } = useAdminDashboard(initialData)
  const { stats, attention } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform metrics and the tasks waiting on the team."
        actions={isFetching ? <Spinner className="text-muted-foreground" /> : null}
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={formatNumber(stats.users.total)}
          icon={Users}
          hint={`${formatNumber(stats.users.newLast30Days)} new in the last 30 days`}
        />
        <StatCard
          label="Active providers"
          value={formatNumber(stats.activeProviders)}
          icon={BadgeCheck}
          hint={`${formatNumber(stats.users.providers)} provider accounts, ${formatNumber(stats.users.customers)} customers`}
        />
        <StatCard
          label="Booking value"
          value={formatPrice(stats.bookingValue)}
          icon={Banknote}
          hint={`${formatNumber(stats.bookingCount)} bookings · ${formatNumber(stats.requests.total)} requests`}
        />
        <StatCard
          label="Commission earned"
          value={formatPrice(stats.commissionEarned)}
          icon={Percent}
          hint="On completed and closed bookings"
        />
      </section>

      <section aria-labelledby="attention-heading" className="space-y-3">
        <h2 id="attention-heading" className="text-lg font-semibold">
          Needs attention
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionLink href="/admin/providers" icon={BadgeCheck} label="Provider applications" count={attention.pendingProviders} />
          <AttentionLink href="/admin/disputes" icon={Scale} label="Open disputes" count={attention.openDisputes} />
          <AttentionLink
            href="/admin/payouts"
            icon={Banknote}
            label="Payout requests"
            count={attention.payoutRequests.count}
            detail={attention.payoutRequests.count ? formatPrice(attention.payoutRequests.amount) : undefined}
          />
          <AttentionLink
            href="/admin/bookings"
            icon={Hourglass}
            label="Awaiting provider"
            count={attention.bookingsAwaitingProvider}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <PendingProvidersCard data={data} className="xl:col-span-2" />
        <OpenDisputesCard data={data} />
      </div>

      <RecentBookingsCard data={data} />
    </div>
  )
}

function AttentionLink({
  href,
  icon: Icon,
  label,
  count,
  detail,
}: {
  href: string
  icon: LucideIcon
  label: string
  count: number
  detail?: string
}) {
  const waiting = count > 0
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent",
        waiting && "border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md",
          waiting ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-muted-foreground">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-heading text-xl font-semibold tabular-nums">{formatNumber(count)}</span>
          {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
        </span>
      </span>
      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground" aria-hidden />
    </Link>
  )
}

function PendingProvidersCard({ data, className }: { data: AdminDashboardDto; className?: string }) {
  const rows = data.pendingProviders
  const total = data.attention.pendingProviders
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Pending provider applications</CardTitle>
        <CardDescription>
          {total > rows.length ? `Oldest ${rows.length} of ${formatNumber(total)}` : "Oldest first"}
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" render={<Link href="/admin/providers" />}>
            All applications
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <BadgeCheck className="mx-auto mb-1 size-5" aria-hidden />
                  No pending verification requests.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/providers/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {p.city} · {p.documentCount} {p.documentCount === 1 ? "document" : "documents"}
                      {p.yearsExperience ? ` · ${p.yearsExperience} yrs` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="line-clamp-2 whitespace-normal">{p.categories.join(", ") || "—"}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDate(p.submittedAt)}</TableCell>
                  <TableCell>
                    <VerificationBadge status="PENDING" />
                  </TableCell>
                  <TableCell>
                    <ProviderDecisionActions id={p.id} name={p.name} status="PENDING" size="sm" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function OpenDisputesCard({ data }: { data: AdminDashboardDto }) {
  const startReview = useStartDisputeReview()
  const rows = data.openDisputes

  function onStartReview(id: string, bookingNumber: string) {
    startReview.mutate(id, {
      onSuccess: () => toast.success(`Dispute on ${bookingNumber} is now under review`),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Open disputes</CardTitle>
        <CardDescription>Oldest first</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" render={<Link href="/admin/disputes" />}>
            All disputes
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={Scale} title="No disputes" description="New disputes show up here until they're resolved." />
        ) : (
          <ul className="divide-y">
            {rows.map((d) => {
              const busy = startReview.isPending && startReview.variables === d.id
              return (
                <li key={d.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/admin/disputes/${d.id}`} className="font-medium tabular-nums hover:underline">
                      {d.bookingNumber}
                    </Link>
                    <DisputeStatusBadge status={d.status} />
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{d.reason}</p>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {d.openedBy} · {formatDate(d.createdAt)}
                    </span>
                    {d.status === "OPEN" ? (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={startReview.isPending}
                        onClick={() => onStartReview(d.id, d.bookingNumber)}
                      >
                        {busy ? <Spinner data-icon="inline-start" /> : <Eye data-icon="inline-start" aria-hidden />}
                        Start review
                      </Button>
                    ) : (
                      <Button size="xs" variant="ghost" render={<Link href={`/admin/disputes/${d.id}`} />}>
                        Open
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RecentBookingsCard({ data }: { data: AdminDashboardDto }) {
  const rows = data.recentBookings
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Latest bookings</CardTitle>
        <CardDescription>The most recent bookings across the platform</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" render={<Link href="/admin/bookings" />}>
            All bookings
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings yet" description="Bookings appear here as soon as customers place them." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium tabular-nums hover:underline">
                      {b.number}
                    </Link>
                  </TableCell>
                  <TableCell>{b.customer}</TableCell>
                  <TableCell>{b.provider}</TableCell>
                  <TableCell className="tabular-nums">
                    <bdi dir="ltr">{formatPrice(b.amount)}</bdi>
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDate(b.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data.stats.requests.open ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="size-4" aria-hidden />
            <Badge variant="info">{formatNumber(data.stats.requests.open)}</Badge>
            open requests are waiting for quotes.
            <Link href="/admin/requests" className="text-primary hover:underline">
              View requests
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
