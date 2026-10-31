import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/settings/commission — docs/SITEMAP.md (AD-06). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Commission" }

export default function AdminSettingsCommissionPage() {
  return <PagePlaceholder title={"Commission"} description={"The platform-wide commission rate."} route="/admin/settings/commission" reqs={["AD-06"]} />
}
