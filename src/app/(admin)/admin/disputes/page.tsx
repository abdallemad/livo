import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/disputes — docs/SITEMAP.md (AD-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "النزاعات" }

export default function AdminDisputesPage() {
  return <PagePlaceholder title={"النزاعات"} description={"النزاعات المفتوحة مستنية قرار."} route="/admin/disputes" reqs={["AD-05"]} />
}
