import { Suspense } from "react"
import type { Metadata } from "next"
import { PayoutsTable } from "@/components/admin/payouts/PayoutsTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/payouts — provider payout requests (docs/SITEMAP.md §5, AD-07, docs/admin-commission-payouts-feature.md).
 * Filters live in the URL and are read by the client table (`useSearchParams` → needs this Suspense
 * boundary); data from `GET /api/admin/payouts`, decisions via `PATCH /api/admin/payouts/[id]/status`.
 * Private: `noindex` comes from the zone layout.
 */
export const metadata: Metadata = { title: "Payout requests" }

export default function AdminPayoutsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PayoutsTable />
    </Suspense>
  )
}
