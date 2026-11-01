import { Suspense } from "react"
import type { Metadata } from "next"
import { ReviewsTable } from "@/components/admin/moderation/ReviewsTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/reviews — review moderation (docs/SITEMAP.md §5, AD-08, docs/admin-disputes-reviews-feature.md).
 * Filters live in the URL and are read by the client list (`useSearchParams` → needs this
 * Suspense boundary); data from `GET /api/admin/reviews`.
 */
export const metadata: Metadata = { title: "Reviews" }

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ReviewsTable />
    </Suspense>
  )
}
