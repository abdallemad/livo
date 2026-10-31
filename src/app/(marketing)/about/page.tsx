import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /about — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "من نحن",
  description: "إحنا مين، وليه عملنا المنصة دي.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"من نحن"} description={"إحنا مين، وليه عملنا المنصة دي."} route="/about" reqs={["MK-05"]} />
    </div>
  )
}
