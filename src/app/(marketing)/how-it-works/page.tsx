import type { Metadata } from "next"
import { PageHero } from "@/components/marketing/PageHero"
import { PagePlaceholder } from "@/components/shared"

/** /how-it-works — docs/SITEMAP.md §2 (MK-03). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "How it works",
  description: "Clear steps for customers and providers: from the request to finishing the job and payment.",
  alternates: { canonical: "/how-it-works" },
}

export default function HowItWorksPage() {
  return (
    <>
      <PageHero title={"How it works"} lead={"Clear steps for customers and providers: from the request to finishing the job and payment."} />
      <div className="mx-auto max-w-4xl px-4 pb-6 md:px-6">
        <PagePlaceholder hideHeader title={"How it works"} description={"Clear steps for customers and providers: from the request to finishing the job and payment."} route="/how-it-works" reqs={["MK-03"]} />
      </div>
    </>
  )
}
