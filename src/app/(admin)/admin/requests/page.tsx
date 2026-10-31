import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/requests — docs/SITEMAP.md (AD-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الطلبات وعروض الأسعار" }

export default function AdminRequestsPage() {
  return <PagePlaceholder title={"الطلبات وعروض الأسعار"} description={"كل طلبات عروض الأسعار والعروض المقدمة."} route="/admin/requests" reqs={["AD-04"]} />
}
