import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/payments — docs/SITEMAP.md (AD-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Payments" }

export default function AdminPaymentsPage() {
  return <PagePlaceholder title={"Payments"} description={"Review all payments."} route="/admin/payments" reqs={["AD-07"]} />
}
