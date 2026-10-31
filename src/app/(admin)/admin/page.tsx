import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, Banknote, ClipboardList, Percent, Scale, Users } from "lucide-react"
import { EmptyState, PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber, formatPrice } from "@/utils/format"

/**
 * /admin — KPI dashboard (docs/SITEMAP.md §5, AD-09). Read-only Server
 * Component: when KPIs exist it calls a service directly (CLAUDE.md §2 exception).
 */
export const metadata: Metadata = { title: "لوحة التحكم" }

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="لوحة التحكم" description="مؤشرات المنصة وأهم المهام المنتظرة." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="المستخدمون" value={formatNumber(0)} icon={Users} />
        <StatCard label="الطلبات" value={formatNumber(0)} icon={ClipboardList} />
        <StatCard label="إجمالي قيمة الحجوزات" value={formatPrice(0)} icon={Banknote} />
        <StatCard label="العمولة" value={formatPrice(0)} icon={Percent} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">طلبات المزودين المنتظرة</CardTitle>
            <Button size="sm" variant="outline" render={<Link href="/admin/providers" />}>
              كل الطلبات
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المزود</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <BadgeCheck className="mx-auto mb-1 size-5" aria-hidden />
                    ما فيش طلبات توثيق منتظرة.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نزاعات مفتوحة</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState icon={Scale} title="ما فيش نزاعات" description="النزاعات الجديدة هتظهر هنا لحد ما تتحل." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
