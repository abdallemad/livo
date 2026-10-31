import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /terms — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms that govern use of the platform.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"Terms of use"} description={"The terms that govern use of the platform."} route="/terms" reqs={["MK-05"]} />
    </div>
  )
}
