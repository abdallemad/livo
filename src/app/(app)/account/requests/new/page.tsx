import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/requests/new — docs/SITEMAP.md (CU-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "New quote request" }

export default function AccountRequestsNewPage() {
  return <PagePlaceholder title={"New quote request"} description={"Describe the job, add photos, and choose the category, address, and budget."} route="/account/requests/new" reqs={["CU-03"]} />
}
