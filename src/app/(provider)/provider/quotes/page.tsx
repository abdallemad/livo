import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/quotes — docs/SITEMAP.md (PR-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "عروض الأسعار" }

export default function ProviderQuotesPage() {
  return <PagePlaceholder title={"عروض الأسعار"} description={"العروض اللي قدّمتها وحالة كل عرض."} route="/provider/quotes" reqs={["PR-07"]} />
}
