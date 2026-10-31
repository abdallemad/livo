import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/requests — docs/SITEMAP.md (PR-06, SY-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الطلبات المتاحة" }

export default function ProviderRequestsPage() {
  return <PagePlaceholder title={"الطلبات المتاحة"} description={"طلبات في تخصصك ومنطقتك مستنية عرض سعر."} route="/provider/requests" reqs={["PR-06", "SY-01"]} />
}
