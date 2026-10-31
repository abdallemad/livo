import { Suspense } from "react"
import type { Metadata } from "next"
import { BookingsTable } from "@/components/admin/orders/BookingsTable"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /admin/bookings — every booking (docs/SITEMAP.md §5, AD-04, docs/admin-requests-bookings-feature.md).
 * Filters live in the URL and are read by the client table (`useSearchParams` → needs this
 * Suspense boundary); data from `GET /api/admin/bookings`.
 */
export const metadata: Metadata = { title: "Bookings" }

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BookingsTable />
    </Suspense>
  )
}
