import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/bookings — docs/SITEMAP.md (AD-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Bookings" }

export default function AdminBookingsPage() {
  return <PagePlaceholder title={"Bookings"} description={"Every booking on the platform."} route="/admin/bookings" reqs={["AD-04"]} />
}
