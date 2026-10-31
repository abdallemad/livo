import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/reviews — docs/SITEMAP.md (AD-08). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "التقييمات" }

export default function AdminReviewsPage() {
  return <PagePlaceholder title={"التقييمات"} description={"إخفاء التقييمات المسيئة."} route="/admin/reviews" reqs={["AD-08"]} />
}
