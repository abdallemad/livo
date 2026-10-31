import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/bookings/[id] — docs/SITEMAP.md (PR-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تفاصيل الحجز" }

export default function ProviderBookingsIdPage() {
  return <PagePlaceholder title={"تفاصيل الحجز"} description={"بيانات العميل بتظهر بعد تأكيد الحجز بس."} route="/provider/bookings/[id]" reqs={["PR-08"]} />
}
