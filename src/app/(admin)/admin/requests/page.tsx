import { Suspense } from "react"
import type { Metadata } from "next"
import { RequestsTable } from "@/components/admin/orders/RequestsTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/requests — every quote request (docs/SITEMAP.md §5, AD-04,
 * docs/admin-requests-bookings-feature.md). Filters live in the URL and are read by the client
 * table (`useSearchParams` → needs this Suspense boundary); data from `GET /api/admin/requests`.
 */
export const metadata: Metadata = { title: "Requests and quotes" }

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <RequestsTable />
    </Suspense>
  )
}
