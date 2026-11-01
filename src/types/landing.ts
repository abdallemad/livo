import type { ProofItem } from "@/utils/trust"
import type { CatalogCategory, CatalogServiceCard } from "./catalog"

/** Landing page data (docs/landing-page.md). Every list may be empty at launch — sections hide or fall back. */

export interface FeaturedProvider {
  id: string
  name: string
  avatarUrl: string | null
  specialty: string | null
  specialtyIconKey: string | null
  yearsExperience: number | null
  completedJobs: number
  /** Only set when the provider has enough reviews (`showProviderStars`). */
  rating: { value: number; count: number } | null
  /** First portfolio photo (public image route), or null. */
  portfolioImage: { url: string; title: string } | null
}

export interface GalleryImage {
  id: string
  url: string
  title: string
  /** "Plumbing · Nasr City" — the provider's first specialty and area (portfolio items have no category of their own). */
  label: string
}

export interface LandingData {
  popularServices: CatalogServiceCard[]
  /** Fallback when there are no services yet: category tiles without prices. */
  categories: CatalogCategory[]
  /** Empty when fewer than `MIN_FEATURED_PROVIDERS` exist — the section hides. */
  providers: FeaturedProvider[]
  /** Empty when fewer than `MIN_GALLERY_IMAGES` exist — the section hides. */
  gallery: GalleryImage[]
  proof: ProofItem[]
  areas: { slug: string; name: string }[]
  policiesPublished: boolean
}
