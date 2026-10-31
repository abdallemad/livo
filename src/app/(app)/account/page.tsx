import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck, ClipboardList, MessageSquareQuote, Plus } from "lucide-react"
import { EmptyState, PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/utils/format"

/** /account — customer dashboard (docs/SITEMAP.md §3, CU-08). Data wiring comes with the booking/request features. */
export const metadata: Metadata = { title: "My account" }

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome"
        description="Track your bookings, requests, and the quotes you've received."
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming bookings" value={formatNumber(0)} icon={CalendarCheck} />
        <StatCard label="Open requests" value={formatNumber(0)} icon={ClipboardList} />
        <StatCard label="New quotes" value={formatNumber(0)} icon={MessageSquareQuote} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarCheck}
              title="No bookings yet"
              description="Book a fixed-price service and it will show up here with its date."
              action={
                <Button variant="outline" render={<Link href="/services" />}>
                  Browse services
                </Button>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open requests</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="No requests yet"
              description="Request a quote for your first project and compare the offers."
              action={
                <Button variant="outline" render={<Link href="/account/requests/new" />}>
                  Request a quote
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
