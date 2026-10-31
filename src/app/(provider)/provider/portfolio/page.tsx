import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/portfolio — docs/SITEMAP.md (PR-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "معرض الأعمال" }

export default function ProviderPortfolioPage() {
  return <PagePlaceholder title={"معرض الأعمال"} description={"ارفع صور شغلك عشان العملاء يثقوا فيك."} route="/provider/portfolio" reqs={["PR-04"]} />
}
