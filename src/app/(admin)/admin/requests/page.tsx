import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/requests — docs/SITEMAP.md (AD-04). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Requests and quotes" }

export default function AdminRequestsPage() {
  return <PagePlaceholder title={"Requests and quotes"} description={"All quote requests and the quotes submitted."} route="/admin/requests" reqs={["AD-04"]} />
}
