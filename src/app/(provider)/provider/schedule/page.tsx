import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/schedule — docs/SITEMAP.md (PR-10). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Schedule" }

export default function ProviderSchedulePage() {
  return <PagePlaceholder title={"Schedule"} description={"The days and hours you're available."} route="/provider/schedule" reqs={["PR-10"]} />
}
