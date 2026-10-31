import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/categories/[id]/edit — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Edit category" }

export default function AdminCategoriesIdEditPage() {
  return <PagePlaceholder title={"Edit category"} description={"Type, parent category, and status."} route="/admin/categories/[id]/edit" reqs={["AD-02"]} />
}
