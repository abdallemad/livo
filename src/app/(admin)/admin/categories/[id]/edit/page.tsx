import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryForm } from "@/components/admin/catalog/CategoryForm"
import { getCategoryForAdmin, getParentOptions } from "@/services/category.service"

/** /admin/categories/[id]/edit — edit a category (AD-02). Saves through `PATCH /api/admin/categories/[id]`. */
const load = cache(getCategoryForAdmin)

export async function generateMetadata({ params }: PageProps<"/admin/categories/[id]/edit">): Promise<Metadata> {
  const category = await load((await params).id)
  return { title: category ? `Edit ${category.nameEn || category.nameAr}` : "Category not found" }
}

export default async function AdminEditCategoryPage({ params }: PageProps<"/admin/categories/[id]/edit">) {
  const { id } = await params
  const [category, parents] = await Promise.all([load(id), getParentOptions(id)])
  if (!category) notFound()
  return <CategoryForm category={category} parents={parents} />
}
