import { Suspense } from "react"
import type { Metadata } from "next"
import { PayoutsBoard } from "@/components/provider/wallet/PayoutsBoard"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /provider/payouts — request a payout + history (docs/SITEMAP.md §4, PR-12,
 * docs/provider-earnings-payouts-feature.md). Page number in the URL (`useSearchParams` → Suspense);
 * data from `GET /api/provider/payouts`, requests via `POST`. Private: `noindex` from the layout.
 */
export const metadata: Metadata = { title: "Payouts" }

export default function ProviderPayoutsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PayoutsBoard />
    </Suspense>
  )
}
