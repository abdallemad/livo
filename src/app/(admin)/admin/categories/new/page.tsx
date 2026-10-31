import type { Metadata } from "next"
import { CategoryForm } from "@/components/admin/catalog/CategoryForm"
import { getParentOptions } from "@/services/category.service"

/** /admin/categories/new — create a category (AD-02). Saves through `POST /api/admin/categories`. */
export const metadata: Metadata = { title: "New category" }

export default async function AdminNewCategoryPage() {
  return <CategoryForm parents={await getParentOptions()} />
}
