import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /services/[category]/[service] — docs/SITEMAP.md §2 (MK-02). Placeholder until the feature lands. */
// ISR: render on first visit, then cache for an hour (CLAUDE.md §4.1 rule 5).
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export const metadata: Metadata = { title: "تفاصيل الخدمة", description: "وصف الخدمة، السعر الثابت، المدة، ومزود الخدمة. احجز في خطوات قليلة." }

export default function ServicesCategoryServicePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"تفاصيل الخدمة"} description={"وصف الخدمة، السعر الثابت، المدة، ومزود الخدمة. احجز في خطوات قليلة."} route="/services/[category]/[service]" reqs={["MK-02"]} />
    </div>
  )
}
