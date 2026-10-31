import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/messages/[bookingId] — docs/SITEMAP.md (CU-06, SY-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المحادثة" }

export default function AccountMessagesBookingIdPage() {
  return <PagePlaceholder title={"المحادثة"} description={"ممنوع تبادل أرقام التليفون أو الإيميل قبل تأكيد الحجز."} route="/account/messages/[bookingId]" reqs={["CU-06", "SY-04"]} />
}
