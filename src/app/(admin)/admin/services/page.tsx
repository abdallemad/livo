import { Suspense } from "react"
import type { Metadata } from "next"
import { ServicesTable } from "@/components/admin/catalog/ServicesTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/services — every fixed-price service and admin moderation (docs/SITEMAP.md §5, AD-02,
 * docs/admin-catalog-feature.md). Filters live in the URL and are read by the client table
 * (`useSearchParams` → needs this Suspense boundary); data comes from `GET /api/admin/services`.
 */
export const metadata: Metadata = { title: "Services" }

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ServicesTable />
    </Suspense>
  )
}
