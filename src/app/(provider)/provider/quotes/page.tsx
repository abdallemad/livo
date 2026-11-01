import { Suspense } from "react"
import type { Metadata } from "next"
import { QuotesList } from "@/components/provider/quotes/QuotesList"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /provider/quotes — every quote the provider sent and its status (docs/SITEMAP.md §4, PR-07,
 * docs/provider-quotes-bookings-feature.md). Filters in the URL, read by the client list
 * (`useSearchParams` → Suspense); data from `GET /api/provider/quotes`. Private: `noindex` from the layout.
 */
export const metadata: Metadata = { title: "My quotes" }

export default function ProviderQuotesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <QuotesList />
    </Suspense>
  )
}
