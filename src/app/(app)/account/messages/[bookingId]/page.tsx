import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/messages/[bookingId] — docs/SITEMAP.md (CU-06, SY-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Chat" }

export default function AccountMessagesBookingIdPage() {
  return <PagePlaceholder title={"Chat"} description={"Sharing phone numbers or emails is not allowed before the booking is confirmed."} route="/account/messages/[bookingId]" reqs={["CU-06", "SY-04"]} />
}
