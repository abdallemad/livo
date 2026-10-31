import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck, ClipboardList, MessageSquareQuote, Plus } from "lucide-react"
import { EmptyState, PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/utils/format"

/** /account — customer dashboard (docs/SITEMAP.md §3, CU-08). Data wiring comes with the booking/request features. */
export const metadata: Metadata = { title: "حسابي" }

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="أهلًا بيك"
        description="تابع حجوزاتك وطلباتك وعروض الأسعار اللي وصلتك."
        actions={
          <>
            <Button variant="outline" render={<Link href="/services" />}>
              تصفّح الخدمات
            </Button>
            <Button render={<Link href="/account/requests/new" />}>
              <Plus data-icon="inline-start" aria-hidden />
              اطلب عرض سعر
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="حجوزات قادمة" value={formatNumber(0)} icon={CalendarCheck} />
        <StatCard label="طلبات مفتوحة" value={formatNumber(0)} icon={ClipboardList} />
        <StatCard label="عروض جديدة" value={formatNumber(0)} icon={MessageSquareQuote} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الحجوزات القادمة</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarCheck}
              title="لسه ما فيش حجوزات"
              description="احجز خدمة بسعر ثابت وهتظهر هنا بميعادها."
              action={
                <Button variant="outline" render={<Link href="/services" />}>
                  تصفّح الخدمات
                </Button>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الطلبات المفتوحة</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="لسه ما فيش طلبات"
              description="اطلب عرض سعر لأول مشروع وقارن بين العروض."
              action={
                <Button variant="outline" render={<Link href="/account/requests/new" />}>
                  اطلب عرض سعر
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
