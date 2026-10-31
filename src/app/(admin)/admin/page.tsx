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
export const metadata: Metadata = { title: "Dashboard" }

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform metrics and the most important pending tasks." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={formatNumber(0)} icon={Users} />
        <StatCard label="Requests" value={formatNumber(0)} icon={ClipboardList} />
        <StatCard label="Total booking value" value={formatPrice(0)} icon={Banknote} />
        <StatCard label="Commission" value={formatPrice(0)} icon={Percent} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending provider applications</CardTitle>
            <Button size="sm" variant="outline" render={<Link href="/admin/providers" />}>
              All applications
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Requested on</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <BadgeCheck className="mx-auto mb-1 size-5" aria-hidden />
                    No pending verification requests.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState icon={Scale} title="No disputes" description="New disputes show up here until they're resolved." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
