import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/requests — docs/SITEMAP.md (CU-13). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "My requests" }

export default function AccountRequestsPage() {
  return <PagePlaceholder title={"My requests"} description={"All your quote requests and the status of each one."} route="/account/requests" reqs={["CU-13"]} />
}
