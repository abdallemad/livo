import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /services — docs/SITEMAP.md §2 (MK-02). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "All services",
  description: "Browse service categories: plumbing, electrical, cleaning, painting and finishing.",
  alternates: { canonical: "/services" },
}

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"All services"} description={"Browse service categories: plumbing, electrical, cleaning, painting and finishing."} route="/services" reqs={["MK-02"]} />
    </div>
  )
}
