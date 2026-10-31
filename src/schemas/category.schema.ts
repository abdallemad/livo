import { z } from "zod"
import { CATEGORY_ICON_KEYS } from "@/constants/category-icons"

/**
 * Admin category CRUD (AD-02, docs/admin-catalog-feature.md). One schema for
 * the form and the `/api/admin/categories` routes.
 *
 * The slug is chosen once at creation and never edited: it is the public URL
 * (`/services/[category]`), and categories have no redirect table yet.
 */
export const CATEGORY_NAME_MAX = 60
export const CATEGORY_DESCRIPTION_MAX = 1000
export const CATEGORY_SLUG_MAX = 60
export const CATEGORY_SORT_MAX = 999

export const CATEGORY_TYPES = ["FIXED", "QUOTE", "BOTH"] as const

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters.`)
    .max(CATEGORY_NAME_MAX, `${label} must be under ${CATEGORY_NAME_MAX} characters.`)

/** Empty string from an untouched input → null. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null)

export const categoryFieldsSchema = z.object({
  nameEn: name("English name"),
  nameAr: name("Arabic name"),
  description: optionalText(CATEGORY_DESCRIPTION_MAX, `Keep the description under ${CATEGORY_DESCRIPTION_MAX} characters.`),
  type: z.enum(CATEGORY_TYPES, { error: "Choose how this category is booked." }),
  parentId: z
    .string()
    .trim()
    .transform((v) => v || null),
  iconKey: z
    .union([z.enum(CATEGORY_ICON_KEYS), z.literal("")])
    .transform((v) => v || null),
  sortOrder: z.coerce
    .number({ error: "Enter a number." })
    .int("Use a whole number.")
    .min(0, "Use 0 or more.")
    .max(CATEGORY_SORT_MAX, `Use ${CATEGORY_SORT_MAX} or less.`),
  isActive: z.boolean(),
})

export const createCategorySchema = categoryFieldsSchema.extend({
  /** Optional: derived from the English name when empty. */
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(CATEGORY_SLUG_MAX, `Keep the URL name under ${CATEGORY_SLUG_MAX} characters.`)
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and single dashes, e.g. air-conditioning.")
    .transform((v) => v || null),
})

export const updateCategorySchema = categoryFieldsSchema

export const categoryStatusSchema = z.object({ isActive: z.boolean() })

/** Form input (before transforms) and parsed output. */
export type CategoryFormInput = z.input<typeof createCategorySchema>
export type CreateCategoryValues = z.output<typeof createCategorySchema>
export type UpdateCategoryValues = z.output<typeof updateCategorySchema>
export type CategoryStatusValues = z.infer<typeof categoryStatusSchema>
