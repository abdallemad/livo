import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/payouts — docs/SITEMAP.md (PR-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Payouts" }

export default function ProviderPayoutsPage() {
  return <PagePlaceholder title={"Payouts"} description={"Request a payout and track past requests."} route="/provider/payouts" reqs={["PR-12"]} />
}
