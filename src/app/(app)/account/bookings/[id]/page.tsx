import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings/[id] — docs/SITEMAP.md (CU-09, CU-10, CU-11, CU-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Booking details" }

export default function AccountBookingsIdPage() {
  return <PagePlaceholder title={"Booking details"} description={"Booking stages, payment, confirming the job is done, review, cancellation or opening a dispute."} route="/account/bookings/[id]" reqs={["CU-09", "CU-10", "CU-11", "CU-12"]} />
}
