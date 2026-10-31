import type { Metadata } from "next"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

/**
 * /onboarding — post-signup wizard (AU-03, PR-01, PR-02, PR-05; docs/onboarding-feature.md).
 * Static shell; the wizard is a client island that loads the user's state from
 * GET /api/onboarding. The proxy sends signed-out users to sign-in and
 * finished users to their dashboard.
 */
export const metadata: Metadata = { title: "Finish signing up", robots: { index: false, follow: false } }

export default function OnboardingPage() {
  return <OnboardingWizard />
}
