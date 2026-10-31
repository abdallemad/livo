import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /search — docs/SITEMAP.md §2 (MK-06). Placeholder until the feature lands. */
// Query URLs get `X-Robots-Tag: noindex, follow` from src/proxy.ts — not from metadata.
export const metadata: Metadata = { title: "البحث", description: "ابحث عن خدمة في منطقتك." }

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"البحث"} description={"ابحث عن خدمة في منطقتك."} route="/search" reqs={["MK-06"]} />
    </div>
  )
}
