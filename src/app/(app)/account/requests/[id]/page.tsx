import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/requests/[id] — docs/SITEMAP.md (CU-04, CU-05, CU-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Request details" }

export default function AccountRequestsIdPage() {
  return <PagePlaceholder title={"Request details"} description={"Request stages and the quotes received. Compare and accept one."} route="/account/requests/[id]" reqs={["CU-04", "CU-05", "CU-08"]} />
}
