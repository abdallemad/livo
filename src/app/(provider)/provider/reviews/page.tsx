import { Suspense } from "react"
import type { Metadata } from "next"
import { ReviewsBoard } from "@/components/provider/reviews/ReviewsBoard"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /provider/reviews — reviews received and replies (docs/SITEMAP.md §4, PR-13,
 * docs/provider-schedule-reviews-feature.md). Filters in the URL, read by the client board
 * (`useSearchParams` → Suspense); data from `GET /api/provider/reviews`. Private: `noindex` from the layout.
 */
export const metadata: Metadata = { title: "Reviews" }

export default function ProviderReviewsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ReviewsBoard />
    </Suspense>
  )
}
