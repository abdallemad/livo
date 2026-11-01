import { Suspense } from "react"
import type { Metadata } from "next"
import { DisputesTable } from "@/components/admin/moderation/DisputesTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/disputes — the dispute queue (docs/SITEMAP.md §5, AD-05, docs/admin-disputes-reviews-feature.md).
 * Filters live in the URL and are read by the client table (`useSearchParams` → needs this
 * Suspense boundary); data from `GET /api/admin/disputes`.
 */
export const metadata: Metadata = { title: "Disputes" }

export default function AdminDisputesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DisputesTable />
    </Suspense>
  )
}
