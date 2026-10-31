import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/bookings/[id] — docs/SITEMAP.md (AD-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تفاصيل الحجز" }

export default function AdminBookingsIdPage() {
  return <PagePlaceholder title={"تفاصيل الحجز"} description={"حالة الدفع والمبلغ المحجوز، والمحادثات (للنزاعات)."} route="/admin/bookings/[id]" reqs={["AD-04"]} />
}
