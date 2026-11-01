import { Suspense } from "react"
import type { Metadata } from "next"
import { PaymentsTable } from "@/components/admin/payments/PaymentsTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/payments — review every payment (docs/SITEMAP.md §5, AD-07, docs/admin-payments-feature.md).
 * Filters live in the URL and are read by the client table (`useSearchParams` → needs this
 * Suspense boundary); data from `GET /api/admin/payments`. Private: `noindex` comes from the zone layout.
 */
export const metadata: Metadata = { title: "Payments" }

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PaymentsTable />
    </Suspense>
  )
}
