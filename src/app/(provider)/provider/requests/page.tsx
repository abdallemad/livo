import { Suspense } from "react"
import type { Metadata } from "next"
import { RequestsBoard } from "@/components/provider/requests/RequestsBoard"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /provider/requests — open quote requests matching the provider (docs/SITEMAP.md §4, PR-06, SY-01,
 * docs/provider-dashboard-requests-feature.md). Filters live in the URL and are read by the client
 * board (`useSearchParams` → needs this Suspense boundary); data from `GET /api/provider/requests`.
 * Private: `noindex` comes from the zone layout.
 */
export const metadata: Metadata = { title: "Available requests" }

export default function ProviderRequestsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <RequestsBoard />
    </Suspense>
  )
}
