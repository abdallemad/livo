import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/categories — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "التصنيفات" }

export default function AdminCategoriesPage() {
  return <PagePlaceholder title={"التصنيفات"} description={"تصنيفات الخدمات: سعر ثابت، عرض سعر، أو الاتنين."} route="/admin/categories" reqs={["AD-02"]} />
}
