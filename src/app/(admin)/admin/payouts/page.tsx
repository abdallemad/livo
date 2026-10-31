import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/payouts — docs/SITEMAP.md (AD-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Payout requests" }

export default function AdminPayoutsPage() {
  return <PagePlaceholder title={"Payout requests"} description={"Approve, reject, or mark as paid."} route="/admin/payouts" reqs={["AD-07"]} />
}
