import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings/[id]/dispute — docs/SITEMAP.md (CU-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Open a dispute" }

export default function AccountBookingsIdDisputePage() {
  return <PagePlaceholder title={"Open a dispute"} description={"Write the reason and add photos or documents."} route="/account/bookings/[id]/dispute" reqs={["CU-12"]} />
}
