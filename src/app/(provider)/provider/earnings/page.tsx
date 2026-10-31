import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/earnings — docs/SITEMAP.md (PR-11). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الأرباح" }

export default function ProviderEarningsPage() {
  return <PagePlaceholder title={"الأرباح"} description={"المستحق، اللي اتحصّل، والعمولة المخصومة."} route="/provider/earnings" reqs={["PR-11"]} />
}
