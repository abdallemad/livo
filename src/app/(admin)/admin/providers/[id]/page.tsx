import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/providers/[id] — docs/SITEMAP.md (AD-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Review provider" }

export default function AdminProvidersIdPage() {
  return <PagePlaceholder title={"Review provider"} description={"Documents, approve or reject with a reason."} route="/admin/providers/[id]" reqs={["AD-01"]} />
}
