import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/services/new — docs/SITEMAP.md (PR-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Add a service" }

export default function ProviderServicesNewPage() {
  return <PagePlaceholder title={"Add a service"} description={"Title, description, price, category, and duration."} route="/provider/services/new" reqs={["PR-05"]} />
}
