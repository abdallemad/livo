import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/requests/[id] — docs/SITEMAP.md (PR-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Request details" }

export default function ProviderRequestsIdPage() {
  return <PagePlaceholder title={"Request details"} description={"See the details and send a quote: price, duration, and a message to the customer."} route="/provider/requests/[id]" reqs={["PR-07"]} />
}
