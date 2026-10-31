import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/settings/commission — docs/SITEMAP.md (AD-06). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "العمولة" }

export default function AdminSettingsCommissionPage() {
  return <PagePlaceholder title={"العمولة"} description={"نسبة العمولة العامة على المنصة."} route="/admin/settings/commission" reqs={["AD-06"]} />
}
