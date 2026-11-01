import { Suspense } from "react"
import type { Metadata } from "next"
import { MyBookingsList } from "@/components/customer/bookings/MyBookingsList"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /account/bookings — the customer's bookings (docs/SITEMAP.md §3, CU-13, docs/customer-account-feature.md).
 * Filters in the URL, read by the client list (`useSearchParams` → Suspense); data from `GET /api/me/bookings`.
 * Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "My bookings" }

export default function AccountBookingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MyBookingsList />
    </Suspense>
  )
}
