import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/requests/[id] — docs/SITEMAP.md (PR-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تفاصيل الطلب" }

export default function ProviderRequestsIdPage() {
  return <PagePlaceholder title={"تفاصيل الطلب"} description={"شوف التفاصيل وقدّم عرض سعر: السعر، المدة، ورسالة للعميل."} route="/provider/requests/[id]" reqs={["PR-07"]} />
}
