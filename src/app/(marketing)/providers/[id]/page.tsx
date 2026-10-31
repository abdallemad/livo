import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /providers/[id] — docs/SITEMAP.md §2 (PR-04, SY-04). Placeholder until the feature lands. */
// ISR: render on first visit, then cache for an hour (CLAUDE.md §4.1 rule 5).
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export const metadata: Metadata = { title: "ملف مزود الخدمة", description: "نبذة، معرض الأعمال، التقييمات والخدمات. بدون بيانات تواصل قبل الحجز." }

export default function ProvidersIdPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"ملف مزود الخدمة"} description={"نبذة، معرض الأعمال، التقييمات والخدمات. بدون بيانات تواصل قبل الحجز."} route="/providers/[id]" reqs={["PR-04", "SY-04"]} />
    </div>
  )
}
