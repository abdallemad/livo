import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/categories — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Categories" }

export default function AdminCategoriesPage() {
  return <PagePlaceholder title={"Categories"} description={"Service categories: fixed price, quote, or both."} route="/admin/categories" reqs={["AD-02"]} />
}
