import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/services — docs/SITEMAP.md (PR-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "My services" }

export default function ProviderServicesPage() {
  return <PagePlaceholder title={"My services"} description={"The fixed-price services you offer."} route="/provider/services" reqs={["PR-05"]} />
}
