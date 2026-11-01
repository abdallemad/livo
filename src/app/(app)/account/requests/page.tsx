import { Suspense } from "react"
import type { Metadata } from "next"
import { MyRequestsList } from "@/components/customer/requests/MyRequestsList"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /account/requests — the customer's quote requests and their status (docs/SITEMAP.md §3, CU-13, CU-11,
 * docs/customer-dashboard-requests-feature.md). Filters in the URL, read by the client list
 * (`useSearchParams` → Suspense); data from `GET /api/me/requests`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "My requests" }

export default function AccountRequestsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MyRequestsList />
    </Suspense>
  )
}
