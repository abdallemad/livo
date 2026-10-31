import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/categories/new — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تصنيف جديد" }

export default function AdminCategoriesNewPage() {
  return <PagePlaceholder title={"تصنيف جديد"} description={"النوع، التصنيف الأب، والتفعيل."} route="/admin/categories/new" reqs={["AD-02"]} />
}
