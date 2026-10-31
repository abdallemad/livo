import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /onboarding — docs/SITEMAP.md §2 Auth (AU-03). */
export const metadata: Metadata = { title: "اختار نوع حسابك", robots: { index: false, follow: false } }

export default function OnboardingPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <PagePlaceholder title={"اختار نوع حسابك"} description={"عميل بيطلب خدمات، ولا مزود خدمة بيقدّم شغله؟"} route="/onboarding" reqs={["AU-03"]} />
    </main>
  )
}
