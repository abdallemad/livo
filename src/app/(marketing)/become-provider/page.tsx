import type { Metadata } from "next"
import { PageHero } from "@/components/marketing/PageHero"
import { PagePlaceholder } from "@/components/shared"

/** /become-provider — docs/SITEMAP.md §2 (MK-04). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "Join as a provider",
  description: "Offer your services, get requests in your area, and get paid safely.",
  alternates: { canonical: "/become-provider" },
}

export default function BecomeProviderPage() {
  return (
    <>
      <PageHero title={"Join as a provider"} lead={"Offer your services, get requests in your area, and get paid safely."} />
      <div className="mx-auto max-w-4xl px-4 pb-6 md:px-6">
        <PagePlaceholder hideHeader title={"Join as a provider"} description={"Offer your services, get requests in your area, and get paid safely."} route="/become-provider" reqs={["MK-04"]} />
      </div>
    </>
  )
}
