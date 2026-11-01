import "server-only"
import { cache } from "react"
import { MAX_FEATURED_PROVIDERS, MAX_GALLERY_IMAGES, MAX_POPULAR_SERVICES } from "@/constants/trust"
import { landingRepository as repo } from "@/repositories/landing.repository"
import { getCategoryDirectory, getPopularServices, getSearchAreas } from "@/services/catalog.service"
import { getPublishedSlugs } from "@/services/static-page.service"
import type { FeaturedProvider, GalleryImage, LandingData } from "@/types/landing"
import { showFeaturedProviders, showGallery, showProviderStars, visibleProof } from "@/utils/trust"

/**
 * Everything the landing page `/` shows from the database (docs/landing-page.md). Called from the Server Component
 * at build / regeneration (CLAUDE.md §2 read-only exception), never per request. Visibility and the social-proof
 * thresholds are applied HERE, so the page can't show a hidden service, an unapproved provider or a number below its
 * threshold. Nothing is invented: empty data means a hidden section or an honest fallback.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr

async function featuredProviders(): Promise<FeaturedProvider[]> {
  const rows = await repo.findFeaturedProviders(MAX_FEATURED_PROVIDERS)
  if (!showFeaturedProviders(rows.length)) return []
  return rows.map((p) => {
    const cat = p.categories[0]?.category
    const item = p.portfolio[0]
    return {
      id: p.userId,
      name: p.user.name || "Livo provider",
      avatarUrl: p.user.avatarUrl,
      specialty: cat ? label(cat) : null,
      specialtyIconKey: cat?.iconKey ?? null,
      yearsExperience: p.yearsExperience,
      completedJobs: p.completedCount,
      rating: showProviderStars(p.ratingCount) ? { value: num(p.ratingAvg), count: p.ratingCount } : null,
      portfolioImage: item?.images[0] ? { url: `/api/images/portfolio/${item.images[0].id}`, title: item.title } : null,
    }
  })
}

async function gallery(): Promise<GalleryImage[]> {
  const rows = await repo.findGalleryImages(MAX_GALLERY_IMAGES)
  if (!showGallery(rows.length)) return []
  return rows.map((f) => {
    const p = f.portfolioItem!.provider
    const parts = [p.categories[0] ? label(p.categories[0].category) : null, p.areas[0] ? label(p.areas[0].area) : null].filter(Boolean)
    return { id: f.id, url: `/api/images/portfolio/${f.id}`, title: f.portfolioItem!.title, label: parts.join(" · ") }
  })
}

export const getLandingData = cache(async (): Promise<LandingData> => {
  const [popularServices, directory, providers, galleryImages, stats, areas, published] = await Promise.all([
    getPopularServices(MAX_POPULAR_SERVICES),
    getCategoryDirectory(),
    featuredProviders(),
    gallery(),
    repo.platformStats(),
    getSearchAreas(),
    getPublishedSlugs(),
  ])
  return {
    popularServices,
    categories: directory.categories,
    providers,
    gallery: galleryImages,
    proof: visibleProof(stats),
    areas,
    policiesPublished: published.some((p) => p.slug === "policies"),
  }
})

/** The public portfolio image route's check: only photos of APPROVED providers with active accounts. */
export function findPublicPortfolioImage(fileId: string) {
  return repo.findPublicPortfolioImage(fileId)
}
