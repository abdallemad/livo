import { Suspense } from "react"
import type { Metadata } from "next"
import { BookingsList } from "@/components/provider/bookings/BookingsList"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /provider/bookings — the provider's bookings with accept / decline / start / mark done
 * (docs/SITEMAP.md §4, PR-08, docs/provider-quotes-bookings-feature.md). Filters in the URL, read by
 * the client list (`useSearchParams` → Suspense); data from `GET /api/provider/bookings`.
 * Private: `noindex` comes from the zone layout.
 */
export const metadata: Metadata = { title: "My bookings" }

export default function ProviderBookingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BookingsList />
    </Suspense>
  )
}
