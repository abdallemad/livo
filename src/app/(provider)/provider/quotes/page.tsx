import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/quotes — docs/SITEMAP.md (PR-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Quotes" }

export default function ProviderQuotesPage() {
  return <PagePlaceholder title={"Quotes"} description={"The quotes you've sent and the status of each."} route="/provider/quotes" reqs={["PR-07"]} />
}
