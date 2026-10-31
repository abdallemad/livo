import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/settings — docs/SITEMAP.md (AU-06). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Settings" }

export default function ProviderSettingsPage() {
  return <PagePlaceholder title={"Settings"} description={"Profile, areas, and account."} route="/provider/settings" reqs={["AU-06"]} />
}
