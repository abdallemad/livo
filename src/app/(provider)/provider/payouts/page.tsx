import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/payouts — docs/SITEMAP.md (PR-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "سحب الأرباح" }

export default function ProviderPayoutsPage() {
  return <PagePlaceholder title={"سحب الأرباح"} description={"اطلب سحب أرباحك وتابع الطلبات السابقة."} route="/provider/payouts" reqs={["PR-12"]} />
}
