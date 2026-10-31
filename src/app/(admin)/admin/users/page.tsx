import { Suspense } from "react"
import type { Metadata } from "next"
import { UsersTable } from "@/components/admin/users/UsersTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/users — every account (docs/SITEMAP.md §5, AD-03, docs/admin-providers-users-feature.md).
 * Filters live in the URL and are read by the client table (`useSearchParams` → needs this
 * Suspense boundary); data comes from `GET /api/admin/users`. Private: `noindex` from the admin layout.
 */
export const metadata: Metadata = { title: "Users" }

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <UsersTable />
    </Suspense>
  )
}
