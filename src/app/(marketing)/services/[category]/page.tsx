import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /services/[category] — docs/SITEMAP.md §2 (MK-02). Placeholder until the feature lands. */
// SSG: return every category slug here once categories exist (CLAUDE.md §4.1 rule 6).
export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export const metadata: Metadata = { title: "خدمات التصنيف", description: "خدمات بسعر ثابت في التصنيف ده، أو اطلب عرض سعر لشغلانة أكبر." }

export default function ServicesCategoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"خدمات التصنيف"} description={"خدمات بسعر ثابت في التصنيف ده، أو اطلب عرض سعر لشغلانة أكبر."} route="/services/[category]" reqs={["MK-02"]} />
    </div>
  )
}
