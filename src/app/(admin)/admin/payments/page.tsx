import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/payments — docs/SITEMAP.md (AD-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المدفوعات" }

export default function AdminPaymentsPage() {
  return <PagePlaceholder title={"المدفوعات"} description={"مراجعة كل المدفوعات."} route="/admin/payments" reqs={["AD-07"]} />
}
