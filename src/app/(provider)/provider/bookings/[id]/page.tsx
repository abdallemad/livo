import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/bookings/[id] — docs/SITEMAP.md (PR-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Booking details" }

export default function ProviderBookingsIdPage() {
  return <PagePlaceholder title={"Booking details"} description={"Customer details are shown only after the booking is confirmed."} route="/provider/bookings/[id]" reqs={["PR-08"]} />
}
