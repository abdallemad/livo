import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings/[id]/dispute — docs/SITEMAP.md (CU-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "افتح نزاع" }

export default function AccountBookingsIdDisputePage() {
  return <PagePlaceholder title={"افتح نزاع"} description={"اكتب السبب وضيف صور أو مستندات."} route="/account/bookings/[id]/dispute" reqs={["CU-12"]} />
}
