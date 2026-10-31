import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/payments — docs/SITEMAP.md (CU-13, SY-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المدفوعات والفواتير" }

export default function AccountPaymentsPage() {
  return <PagePlaceholder title={"المدفوعات والفواتير"} description={"كل مدفوعاتك وفواتيرك."} route="/account/payments" reqs={["CU-13", "SY-07"]} />
}
