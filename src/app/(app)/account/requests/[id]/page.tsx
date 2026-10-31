import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/requests/[id] — docs/SITEMAP.md (CU-04, CU-05, CU-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تفاصيل الطلب" }

export default function AccountRequestsIdPage() {
  return <PagePlaceholder title={"تفاصيل الطلب"} description={"مراحل الطلب، العروض اللي وصلت، قارن واقبل عرض واحد."} route="/account/requests/[id]" reqs={["CU-04", "CU-05", "CU-08"]} />
}
