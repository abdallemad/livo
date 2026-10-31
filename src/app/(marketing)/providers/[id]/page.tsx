import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /providers/[id] — docs/SITEMAP.md §2 (PR-04, SY-04). Placeholder until the feature lands. */
// ISR: render on first visit, then cache for an hour (CLAUDE.md §4.1 rule 5).
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export const metadata: Metadata = { title: "Provider profile", description: "Bio, portfolio, reviews, and services. No contact details before booking." }

export default function ProvidersIdPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"Provider profile"} description={"Bio, portfolio, reviews, and services. No contact details before booking."} route="/providers/[id]" reqs={["PR-04", "SY-04"]} />
    </div>
  )
}
