import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/bookings — docs/SITEMAP.md (PR-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "My bookings" }

export default function ProviderBookingsPage() {
  return <PagePlaceholder title={"My bookings"} description={"Accept, decline, start, or complete the job."} route="/provider/bookings" reqs={["PR-08"]} />
}
