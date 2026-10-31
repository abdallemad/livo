import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/reviews — docs/SITEMAP.md (PR-13). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "التقييمات" }

export default function ProviderReviewsPage() {
  return <PagePlaceholder title={"التقييمات"} description={"تقييمات العملاء والرد عليها."} route="/provider/reviews" reqs={["PR-13"]} />
}
