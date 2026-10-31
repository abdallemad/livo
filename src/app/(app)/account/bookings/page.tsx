import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings — docs/SITEMAP.md (CU-13). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "حجوزاتي" }

export default function AccountBookingsPage() {
  return <PagePlaceholder title={"حجوزاتي"} description={"كل حجوزاتك القادمة والسابقة."} route="/account/bookings" reqs={["CU-13"]} />
}
