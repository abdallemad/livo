import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/requests/new — docs/SITEMAP.md (CU-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "طلب عرض سعر جديد" }

export default function AccountRequestsNewPage() {
  return <PagePlaceholder title={"طلب عرض سعر جديد"} description={"اوصف الشغلانة، ضيف صور، واختار التصنيف والعنوان والميزانية."} route="/account/requests/new" reqs={["CU-03"]} />
}
