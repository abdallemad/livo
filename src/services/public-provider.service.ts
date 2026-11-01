import "server-only"
import { publicProviderRepository as repo } from "@/repositories/public-provider.repository"
import { getProviderReviews, getProviderServiceCards } from "@/services/catalog.service"
import type { PublicProviderProfile } from "@/types/catalog"
import { maskContactDetails } from "@/utils/contact-mask"
import { publicWeek } from "@/utils/provider-profile"
import { ratingDistribution } from "@/utils/review-summary"
import { showProviderStars } from "@/utils/trust"

/**
 * The public provider profile (`/providers/[id]`, PR-04, PR-10, SY-04; docs/provider-profile-feature.md).
 * Only an approved provider with an active account is found — anyone else is a 404, so a suspended or rejected provider
 * can't be reached by an old link. Provider-written text (bio, portfolio, replies) passes through the contact masker:
 * no phone, email or chat link is ever shown before a booking (SY-04).
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr
const mask = (text: string | null) => (text ? maskContactDetails(text).text : null)

const SERVICES = 12
const PORTFOLIO = 12
const REVIEWS = 10

export const providerHref = (id: string) => `/providers/${encodeURIComponent(id)}`

export async function getPublicProviderProfile(id: string): Promise<PublicProviderProfile | null> {
  // Clerk ids are short ASCII; anything else can't be a provider and shouldn't reach the DB.
  if (!/^[\w-]{1,64}$/.test(id)) return null
  const p = await repo.findProvider(id)
  if (!p) return null

  const [services, portfolio, reviews, breakdown] = await Promise.all([
    getProviderServiceCards(id, SERVICES),
    repo.findPortfolio(id, PORTFOLIO),
    getProviderReviews(id, REVIEWS),
    repo.ratingBreakdown(id),
  ])

  return {
    id: p.userId,
    href: providerHref(p.userId),
    name: p.user.name || "Livo provider",
    avatarUrl: p.user.avatarUrl,
    bio: mask(p.bio),
    yearsExperience: p.yearsExperience,
    rating: num(p.ratingAvg),
    reviewsCount: p.ratingCount,
    completedJobs: p.completedCount,
    areas: p.areas.map((a) => label(a.area)),
    city: label(p.city),
    memberSince: p.createdAt.toISOString(),
    specialties: p.categories
      .filter((c) => !c.category.parent || c.category.parent.isActive)
      .map((c) => ({ slug: c.category.slug, name: label(c.category) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    hours: publicWeek(p.availability),
    showStars: showProviderStars(p.ratingCount),
    ratingBreakdown: ratingDistribution(Object.fromEntries(breakdown.map((g) => [g.rating, g._count._all]))),
    services,
    portfolio: portfolio.map((item) => ({ id: item.id, title: mask(item.title) ?? "", description: mask(item.description), images: item.images.map((i) => `/api/images/portfolio/${i.id}`) })),
    reviews,
    updatedAt: p.updatedAt.toISOString(),
  }
}

/** Sitemap entries for public providers (CLAUDE.md §11). */
export async function getPublicProviderPaths(take = 5000) {
  return (await repo.findPublicProviderIds(take)).map((p) => ({ path: providerHref(p.userId), updatedAt: p.updatedAt }))
}
