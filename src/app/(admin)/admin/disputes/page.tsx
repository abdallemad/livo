import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/disputes — docs/SITEMAP.md (AD-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Disputes" }

export default function AdminDisputesPage() {
  return <PagePlaceholder title={"Disputes"} description={"Open disputes waiting for a decision."} route="/admin/disputes" reqs={["AD-05"]} />
}
