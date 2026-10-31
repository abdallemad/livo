import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/bookings — docs/SITEMAP.md (PR-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "حجوزاتي" }

export default function ProviderBookingsPage() {
  return <PagePlaceholder title={"حجوزاتي"} description={"اقبل، ارفض، ابدأ، أو خلّص الشغل."} route="/provider/bookings" reqs={["PR-08"]} />
}
