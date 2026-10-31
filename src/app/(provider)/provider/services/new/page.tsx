import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/services/new — docs/SITEMAP.md (PR-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "ضيف خدمة" }

export default function ProviderServicesNewPage() {
  return <PagePlaceholder title={"ضيف خدمة"} description={"العنوان، الوصف، السعر، التصنيف، والمدة."} route="/provider/services/new" reqs={["PR-05"]} />
}
