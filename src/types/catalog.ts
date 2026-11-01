import type { CategoryType } from "@prisma/client"
import type { Paginated } from "./api"

/**
 * Public catalog contracts (MK-02; docs/catalog-feature.md). Only LIVE services (`VISIBLE_SERVICE`) and
 * active categories ever appear. No provider contact details (SY-04).
 */

export interface CatalogServiceCard {
  id: string
  slug: string
  title: string
  /** Detail page: `/services/<category slug>/<service slug>`. */
  href: string
  categoryName: string
  providerId: string
  providerName: string
  price: number
  durationMinutes: number | null
  rating: number
  reviewsCount: number
  /** Public image route (`/api/images/services/[id]`), or null. */
  imageUrl: string | null
}

export interface CatalogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  iconKey: string | null
  type: CategoryType
  parentSlug: string | null
  /** Live services in it (and in its sub-categories for a parent). */
  serviceCount: number
  children: { slug: string; name: string; serviceCount: number }[]
}

export interface CatalogFilterOptions {
  categories: { slug: string; name: string; parentName: string | null }[]
  areas: { slug: string; name: string }[]
  /** Cheapest / dearest live service, for the price inputs' hints. */
  priceBounds: { min: number; max: number } | null
}

export type CatalogServicePage = Paginated<CatalogServiceCard>

export interface CatalogIndex {
  /** Top-level categories with their sub-categories. */
  categories: CatalogCategory[]
  options: CatalogFilterOptions
  /** The default view (recommended, page 1) — server-rendered and the island's initial data. */
  initial: CatalogServicePage
}

export interface CategoryPageData {
  category: CatalogCategory
  parent: { slug: string; name: string } | null
  services: CatalogServicePage
  /** Approved providers offering this category (or a sub-category) — "N verified providers". */
  providerCount: number
}
