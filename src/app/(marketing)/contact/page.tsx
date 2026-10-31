import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /contact — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "Contact us",
  description: "Send us a message and we'll get back to you as soon as we can.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"Contact us"} description={"Send us a message and we'll get back to you as soon as we can."} route="/contact" reqs={["MK-05"]} />
    </div>
  )
}
