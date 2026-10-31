import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/requests — docs/SITEMAP.md (PR-06, SY-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Available requests" }

export default function ProviderRequestsPage() {
  return <PagePlaceholder title={"Available requests"} description={"Requests in your specialty and area waiting for a quote."} route="/provider/requests" reqs={["PR-06", "SY-01"]} />
}
