import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/bookings/[id]/review — docs/SITEMAP.md (CU-10). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "قيّم الخدمة" }

export default function AccountBookingsIdReviewPage() {
  return <PagePlaceholder title={"قيّم الخدمة"} description={"نجوم وتعليق — متاح بعد ما الحجز يكتمل."} route="/account/bookings/[id]/review" reqs={["CU-10"]} />
}
