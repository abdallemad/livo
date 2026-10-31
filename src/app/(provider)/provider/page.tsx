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
export const metadata: Metadata = { title: "لوحة المزود" }

export default function ProviderDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="أهلًا بيك"
        description="الطلبات الجديدة في منطقتك وحجوزات النهارده."
        actions={
          <Button size="lg" render={<Link href="/provider/requests" />}>
            <Inbox data-icon="inline-start" aria-hidden />
            شوف الطلبات المتاحة
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="طلبات جديدة" value={formatNumber(0)} icon={Inbox} />
        <StatCard label="حجوزات النهارده" value={formatNumber(0)} icon={CalendarCheck} />
        <StatCard label="أرباح الشهر" value={formatPrice(0)} icon={Wallet} />
        <StatCard label="التقييم" value="—" icon={Star} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">طلبات جديدة تناسبك</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Inbox}
              title="ما فيش طلبات جديدة دلوقتي"
              description="هنبلغك أول ما ييجي طلب في تخصصك ومنطقتك."
              action={
                <Button variant="outline" render={<Link href="/provider/settings" />}>
                  راجع مناطق الشغل
                </Button>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">حجوزات النهارده</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarCheck}
              title="ما فيش حجوزات النهارده"
              description="ضيف خدمة بسعر ثابت عشان العملاء يحجزوا معاك على طول."
              action={
                <Button variant="outline" render={<Link href="/provider/services/new" />}>
                  ضيف خدمة
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
