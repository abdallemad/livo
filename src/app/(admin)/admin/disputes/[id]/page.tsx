import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/disputes/[id] — docs/SITEMAP.md (AD-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Resolve dispute" }

export default function AdminDisputesIdPage() {
  return <PagePlaceholder title={"Resolve dispute"} description={"Review the evidence, decide, and refund all or part of the amount."} route="/admin/disputes/[id]" reqs={["AD-05"]} />
}
