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
  /** The category's icon, or its parent's (`constants/category-icons.ts`). */
  categoryIconKey: string | null
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

/** `/category` — the directory of every category (top-level, each with its sub-categories). */
export interface CategoryDirectory {
  categories: CatalogCategory[]
}

/** The public provider summary on a service page — name, rating, track record; never contact details (SY-04). */
export interface PublicProviderSummary {
  id: string
  name: string
  avatarUrl: string | null
  /** Contact details masked (SY-04). */
  bio: string | null
  yearsExperience: number | null
  rating: number
  reviewsCount: number
  completedJobs: number
  /** Area names; empty = the whole city. */
  areas: string[]
  city: string
  memberSince: string
}

export interface PublicReview {
  id: string
  rating: number
  comment: string | null
  reply: string | null
  customerFirstName: string | null
  createdAt: string
}

export interface ServiceDetail {
  id: string
  slug: string
  title: string
  /** Contact details masked (SY-04). */
  description: string
  price: number
  durationMinutes: number | null
  images: string[]
  href: string
  category: { slug: string; name: string; type: string }
  parent: { slug: string; name: string } | null
  provider: PublicProviderSummary
  reviews: PublicReview[]
  moreFromProvider: CatalogServiceCard[]
  similar: CatalogServiceCard[]
  updatedAt: string
}

/** A service lookup: found, moved to another category (308), or nothing (404). */
export type ServiceLookup = { kind: "found"; service: ServiceDetail } | { kind: "moved"; href: string } | { kind: "missing" }
