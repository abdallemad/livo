import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/services — docs/SITEMAP.md (PR-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "خدماتي" }

export default function ProviderServicesPage() {
  return <PagePlaceholder title={"خدماتي"} description={"الخدمات اللي بتقدمها بسعر ثابت."} route="/provider/services" reqs={["PR-05"]} />
}
