import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/messages/[bookingId] — docs/SITEMAP.md (PR-09). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المحادثة" }

export default function ProviderMessagesBookingIdPage() {
  return <PagePlaceholder title={"المحادثة"} description={"ممنوع تبادل أرقام التليفون أو الإيميل قبل تأكيد الحجز."} route="/provider/messages/[bookingId]" reqs={["PR-09"]} />
}
