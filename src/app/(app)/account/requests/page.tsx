import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/requests — docs/SITEMAP.md (CU-13). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "طلباتي" }

export default function AccountRequestsPage() {
  return <PagePlaceholder title={"طلباتي"} description={"كل طلبات عروض الأسعار وحالة كل طلب."} route="/account/requests" reqs={["CU-13"]} />
}
