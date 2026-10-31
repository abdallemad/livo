import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/verification — docs/SITEMAP.md (PR-02, PR-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Account verification" }

export default function ProviderVerificationPage() {
  return <PagePlaceholder title={"Account verification"} description={"Upload your ID, photo, and certificates, and track the review status."} route="/provider/verification" reqs={["PR-02", "PR-03"]} />
}
