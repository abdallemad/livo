import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/categories/new — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "New category" }

export default function AdminCategoriesNewPage() {
  return <PagePlaceholder title={"New category"} description={"Type, parent category, and status."} route="/admin/categories/new" reqs={["AD-02"]} />
}
