import type { Metadata } from "next"
import { CategoriesTable } from "@/components/admin/catalog/CategoriesTable"
import { listCategoriesForAdmin } from "@/services/category.service"

/**
 * /admin/categories — the category tree (docs/SITEMAP.md §5, AD-02, docs/admin-catalog-feature.md).
 * First snapshot read on the server (service called directly — CLAUDE.md §2 exception; the admin
 * layout enforced the role) and handed to the client as `initialData`; on/off and delete go through
 * `/api/admin/categories/*` and refetch. Private: `noindex` from the admin layout.
 */
export const metadata: Metadata = { title: "Categories" }

export default async function AdminCategoriesPage() {
  return <CategoriesTable initialData={await listCategoriesForAdmin()} />
}
