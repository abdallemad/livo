import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings/[id]/review — docs/SITEMAP.md (CU-10). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Rate the service" }

export default function AccountBookingsIdReviewPage() {
  return <PagePlaceholder title={"Rate the service"} description={"Stars and a comment — Available once the booking is complete."} route="/account/bookings/[id]/review" reqs={["CU-10"]} />
}
