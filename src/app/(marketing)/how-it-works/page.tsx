import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /how-it-works — docs/SITEMAP.md §2 (MK-03). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "How it works",
  description: "Clear steps for customers and providers: from the request to finishing the job and payment.",
  alternates: { canonical: "/how-it-works" },
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"How it works"} description={"Clear steps for customers and providers: from the request to finishing the job and payment."} route="/how-it-works" reqs={["MK-03"]} />
    </div>
  )
}
