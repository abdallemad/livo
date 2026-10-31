"use client"

import Link from "next/link"
import { Ban, CalendarCheck } from "lucide-react"
import { DetailField } from "@/components/admin/shared/DetailField"
import { HistoryCard } from "@/components/admin/shared/HistoryCard"
import { BookingStatusBadge, EmptyState, PageHeader, ProviderStatusBadge, StatCard, UserStatusBadge } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ROLE_LABEL } from "@/constants/status"
import { useAdminUser } from "@/hooks/use-admin-users"
import type { AdminUserDetail } from "@/types/admin"
import { formatDate, formatNumber, formatPhone, formatPrice } from "@/utils/format"
import { UserStatusActions } from "./UserStatusActions"

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?"

/** `/admin/users/[id]` (AD-03): account, activity, recent bookings, history, suspend / activate. */
export function UserDetail({ initialData }: { initialData: AdminUserDetail }) {
  const { data: u } = useAdminUser(initialData.id, initialData)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar size="lg" className="size-14">
          {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">{initials(u.name)}</AvatarFallback>
        </Avatar>
        <PageHeader
          className="flex-1"
          title={u.name}
          description={`${ROLE_LABEL[u.role]} · joined ${formatDate(u.joinedAt)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <UserStatusBadge status={u.status} />
              <UserStatusActions id={u.id} name={u.name} role={u.role} status={u.status} size="default" />
            </div>
          }
        />
      </div>

      {u.status === "SUSPENDED" ? (
        <Alert variant="destructive">
          <Ban aria-hidden />
          <AlertTitle>Account suspended</AlertTitle>
          <AlertDescription>{u.suspensionReason ? `“${u.suspensionReason}”` : "No reason recorded."}</AlertDescription>
        </Alert>
      ) : null}

      <section aria-label="Activity" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests posted" value={formatNumber(u.counts.requests)} />
        <StatCard label="Bookings as customer" value={formatNumber(u.counts.bookingsAsCustomer)} />
        <StatCard label="Bookings as provider" value={u.provider ? formatNumber(u.counts.bookingsAsProvider) : "—"} />
        <StatCard
          label="Disputes opened"
          value={formatNumber(u.counts.disputesOpened)}
          hint={`${formatNumber(u.counts.reviewsWritten)} reviews written`}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailField label="Email">{u.email ?? "—"}</DetailField>
                <DetailField label="Phone">{u.phone ? <bdi dir="ltr">{formatPhone(u.phone)}</bdi> : "—"}</DetailField>
                <DetailField label="Role">
                  <Badge variant={u.role === "ADMIN" ? "primary" : "secondary"}>{ROLE_LABEL[u.role]}</Badge>
                </DetailField>
                <DetailField label="City">{u.city ?? "—"}</DetailField>
                <DetailField label="Sign-up">{u.onboardingCompleted ? "Complete" : "Unfinished (still in the wizard)"}</DetailField>
                {u.provider ? (
                  <DetailField label="Provider profile">
                    <span className="flex items-center gap-2">
                      <ProviderStatusBadge status={u.provider.verificationStatus} />
                      <Link href={`/admin/providers/${u.id}`} className="text-sm text-primary hover:underline">
                        Review page
                      </Link>
                    </span>
                  </DetailField>
                ) : null}
                {u.deletedAt ? <DetailField label="Deleted on">{formatDate(u.deletedAt)}</DetailField> : null}
                <DetailField label="User id" className="sm:col-span-2">
                  <code className="text-xs break-all text-muted-foreground">{u.id}</code>
                </DetailField>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {u.recentBookings.length === 0 ? (
                <EmptyState icon={CalendarCheck} title="No bookings" description="Bookings on either side of the marketplace show up here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>As</TableHead>
                      <TableHead>With</TableHead>
                      <TableHead className="text-end">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {u.recentBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link href={`/admin/bookings/${b.id}`} className="font-medium tabular-nums hover:underline">
                            {b.number}
                          </Link>
                        </TableCell>
                        <TableCell>{b.side === "CUSTOMER" ? "Customer" : "Provider"}</TableCell>
                        <TableCell>{b.side === "CUSTOMER" ? b.provider : b.customer}</TableCell>
                        <TableCell className="text-end tabular-nums">
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
            </CardContent>
          </Card>
        </div>
        <HistoryCard entries={u.history} />
      </div>
    </div>
  )
}
