import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/services — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Services" }

export default function AdminServicesPage() {
  return <PagePlaceholder title={"Services"} description={"All fixed-price services — Review or suspend."} route="/admin/services" reqs={["AD-02"]} />
}
