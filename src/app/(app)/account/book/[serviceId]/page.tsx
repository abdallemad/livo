import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/book/[serviceId] — docs/SITEMAP.md (CU-02, CU-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Book the service" }

export default function AccountBookServiceIdPage() {
  return <PagePlaceholder title={"Book the service"} description={"Date & time → Address → Notes → Payment → Confirmation."} route="/account/book/[serviceId]" reqs={["CU-02", "CU-07"]} />
}
