import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /contact — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "ابعت لنا رسالتك وهنرد عليك في أقرب وقت.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"تواصل معنا"} description={"ابعت لنا رسالتك وهنرد عليك في أقرب وقت."} route="/contact" reqs={["MK-05"]} />
    </div>
  )
}
