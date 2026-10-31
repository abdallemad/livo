import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/portfolio — docs/SITEMAP.md (PR-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Portfolio" }

export default function ProviderPortfolioPage() {
  return <PagePlaceholder title={"Portfolio"} description={"Upload photos of your work so customers can trust you."} route="/provider/portfolio" reqs={["PR-04"]} />
}
