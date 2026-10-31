import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /become-provider — docs/SITEMAP.md §2 (MK-04). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "Join as a provider",
  description: "Offer your services, get requests in your area, and get paid safely.",
  alternates: { canonical: "/become-provider" },
}

export default function BecomeProviderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"Join as a provider"} description={"Offer your services, get requests in your area, and get paid safely."} route="/become-provider" reqs={["MK-04"]} />
    </div>
  )
}
