import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/bookings/[id] — docs/SITEMAP.md (AD-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Booking details" }

export default function AdminBookingsIdPage() {
  return <PagePlaceholder title={"Booking details"} description={"Payment status, amount held, and chats (for disputes)."} route="/admin/bookings/[id]" reqs={["AD-04"]} />
}
