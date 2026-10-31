import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/earnings — docs/SITEMAP.md (PR-11). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Earnings" }

export default function ProviderEarningsPage() {
  return <PagePlaceholder title={"Earnings"} description={"Owed, collected, and commission deducted."} route="/provider/earnings" reqs={["PR-11"]} />
}
