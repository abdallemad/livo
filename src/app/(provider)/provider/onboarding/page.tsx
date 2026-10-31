import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/onboarding — docs/SITEMAP.md (PR-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Complete your profile" }

export default function ProviderOnboardingPage() {
  return <PagePlaceholder title={"Complete your profile"} description={"Specialty, years of experience, categories, and the areas you work in."} route="/provider/onboarding" reqs={["PR-01"]} />
}
