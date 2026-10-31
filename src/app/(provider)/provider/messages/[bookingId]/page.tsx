import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/messages/[bookingId] — docs/SITEMAP.md (PR-09). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Chat" }

export default function ProviderMessagesBookingIdPage() {
  return <PagePlaceholder title={"Chat"} description={"Sharing phone numbers or emails is not allowed before the booking is confirmed."} route="/provider/messages/[bookingId]" reqs={["PR-09"]} />
}
