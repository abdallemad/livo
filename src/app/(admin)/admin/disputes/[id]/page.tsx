import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/disputes/[id] — docs/SITEMAP.md (AD-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "حل النزاع" }

export default function AdminDisputesIdPage() {
  return <PagePlaceholder title={"حل النزاع"} description={"راجع الأدلة، احكم، ورجّع المبلغ كله أو جزء منه."} route="/admin/disputes/[id]" reqs={["AD-05"]} />
}
