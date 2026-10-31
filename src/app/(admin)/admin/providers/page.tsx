import { Suspense } from "react"
import type { Metadata } from "next"
import { ProvidersTable } from "@/components/admin/providers/ProvidersTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/providers — provider review queue and status tabs (docs/SITEMAP.md §5, AD-01,
 * docs/admin-providers-users-feature.md). Filters live in the URL and are read by the
 * client table (`useSearchParams` → needs this Suspense boundary); data comes from
 * `GET /api/admin/providers`. Private: `noindex` comes from the admin layout.
 */
export const metadata: Metadata = { title: "Provider applications" }

export default function AdminProvidersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ProvidersTable />
    </Suspense>
  )
}
