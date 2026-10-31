import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings/[id] — docs/SITEMAP.md (CU-09, CU-10, CU-11, CU-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تفاصيل الحجز" }

export default function AccountBookingsIdPage() {
  return <PagePlaceholder title={"تفاصيل الحجز"} description={"مراحل الحجز، الدفع، تأكيد إتمام الشغل، التقييم، الإلغاء أو فتح نزاع."} route="/account/bookings/[id]" reqs={["CU-09", "CU-10", "CU-11", "CU-12"]} />
}
