import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/payouts — docs/SITEMAP.md (AD-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "طلبات السحب" }

export default function AdminPayoutsPage() {
  return <PagePlaceholder title={"طلبات السحب"} description={"اقبل، ارفض، أو علّم كمدفوع."} route="/admin/payouts" reqs={["AD-07"]} />
}
