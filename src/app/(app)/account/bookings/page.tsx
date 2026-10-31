import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings — docs/SITEMAP.md (CU-13). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "My bookings" }

export default function AccountBookingsPage() {
  return <PagePlaceholder title={"My bookings"} description={"All your upcoming and past bookings."} route="/account/bookings" reqs={["CU-13"]} />
}
