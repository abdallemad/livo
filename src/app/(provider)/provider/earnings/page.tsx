import { Suspense } from "react"
import type { Metadata } from "next"
import { EarningsBoard } from "@/components/provider/wallet/EarningsBoard"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /provider/earnings — wallet: due, on hold, received, commission, and every movement (docs/SITEMAP.md §4,
 * PR-11, docs/provider-earnings-payouts-feature.md). Filters in the URL, read by the client board
 * (`useSearchParams` → Suspense); data from `GET /api/provider/earnings`. Private: `noindex` from the layout.
 */
export const metadata: Metadata = { title: "Earnings" }

export default function ProviderEarningsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <EarningsBoard />
    </Suspense>
  )
}
