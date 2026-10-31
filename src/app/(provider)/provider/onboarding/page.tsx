import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/onboarding — docs/SITEMAP.md (PR-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "كمّل ملفك" }

export default function ProviderOnboardingPage() {
  return <PagePlaceholder title={"كمّل ملفك"} description={"التخصص، سنين الخبرة، التصنيفات، والمناطق اللي بتشتغل فيها."} route="/provider/onboarding" reqs={["PR-01"]} />
}
