import type { Metadata } from "next"
import { PageHero } from "@/components/marketing/PageHero"
import { PagePlaceholder } from "@/components/shared"

/** /contact — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "Contact us",
  description: "Send us a message and we'll get back to you as soon as we can.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <>
      <PageHero title={"Contact us"} lead={"Send us a message and we'll get back to you as soon as we can."} />
      <div className="mx-auto max-w-4xl px-4 pb-6 md:px-6">
        <PagePlaceholder hideHeader title={"Contact us"} description={"Send us a message and we'll get back to you as soon as we can."} route="/contact" reqs={["MK-05"]} />
      </div>
    </>
  )
}
