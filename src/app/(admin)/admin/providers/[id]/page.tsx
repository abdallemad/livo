import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/providers/[id] — docs/SITEMAP.md (AD-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "مراجعة مزود" }

export default function AdminProvidersIdPage() {
  return <PagePlaceholder title={"مراجعة مزود"} description={"المستندات، القبول أو الرفض مع السبب."} route="/admin/providers/[id]" reqs={["AD-01"]} />
}
