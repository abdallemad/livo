import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/schedule — docs/SITEMAP.md (PR-10). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المواعيد" }

export default function ProviderSchedulePage() {
  return <PagePlaceholder title={"المواعيد"} description={"الأيام والساعات اللي متاح فيها."} route="/provider/schedule" reqs={["PR-10"]} />
}
