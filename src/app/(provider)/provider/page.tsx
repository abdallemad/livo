import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck, Inbox, Star, Wallet } from "lucide-react"
import { EmptyState, PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatPrice } from "@/utils/format"

/**
 * /provider — provider dashboard (docs/SITEMAP.md §4, PR-14). Providers are
 * mostly non-technical and on phones: few blocks, big targets, one clear next step.
 */
export const metadata: Metadata = { title: "Provider dashboard" }

export default function ProviderDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome"
        description="New requests in your area and today's bookings."
        actions={
          <Button size="lg" render={<Link href="/provider/requests" />}>
            <Inbox data-icon="inline-start" aria-hidden />
            See available requests
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New requests" value={formatNumber(0)} icon={Inbox} />
        <StatCard label="Today's bookings" value={formatNumber(0)} icon={CalendarCheck} />
        <StatCard label="Earnings this month" value={formatPrice(0)} icon={Wallet} />
        <StatCard label="Rating" value="—" icon={Star} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New requests for you</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Inbox}
              title="No new requests right now"
              description="We'll let you know as soon as a request comes in for your specialty and area."
              action={
                <Button variant="outline" render={<Link href="/provider/settings" />}>
                  Review your work areas
                </Button>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today’s bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarCheck}
              title="No bookings today"
              description="Add a fixed-price service so customers can book you right away."
              action={
                <Button variant="outline" render={<Link href="/provider/services/new" />}>
                  Add a service
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
