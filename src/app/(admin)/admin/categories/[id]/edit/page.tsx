import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/categories/[id]/edit — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تعديل التصنيف" }

export default function AdminCategoriesIdEditPage() {
  return <PagePlaceholder title={"تعديل التصنيف"} description={"النوع، التصنيف الأب، والتفعيل."} route="/admin/categories/[id]/edit" reqs={["AD-02"]} />
}
