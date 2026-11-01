import "server-only"
import type { Prisma } from "@prisma/client"
import { catalogRepository as repo, type CatalogServiceRow } from "@/repositories/catalog.repository"
import type { CatalogQuery } from "@/schemas/catalog.schema"
import { VISIBLE_SERVICE } from "@/services/admin-catalog.service"
import type { CatalogCategory, CatalogFilterOptions, CatalogIndex, CatalogServicePage, CategoryDirectory, CategoryPageData, ServiceLookup } from "@/types/catalog"
import { CATALOG_PAGE_SIZE, type CatalogSort, normalizePriceRange, serviceHref } from "@/utils/catalog"
import { maskContactDetails } from "@/utils/contact-mask"
import { firstName } from "@/utils/provider-booking"

/**
 * The public catalog (MK-02, MK-06; docs/catalog-feature.md): categories with live-service counts, the
 * filtered service listing behind `/services` and `GET /api/services`, and the category pages. Every service
 * read goes through `VISIBLE_SERVICE` (switched on, not hidden by an admin, provider APPROVED + ACTIVE,
 * category and parent active) — a service that isn't live never appears anywhere public.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr

const ORDER: Record<CatalogSort, Prisma.ServiceOrderByWithRelationInput[]> = {
  recommended: [{ provider: { ratingAvg: "desc" } }, { provider: { ratingCount: "desc" } }, { createdAt: "desc" }, { id: "asc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "asc" }],
  rating: [{ provider: { ratingAvg: "desc" } }, { provider: { ratingCount: "desc" } }, { id: "asc" }],
  newest: [{ createdAt: "desc" }, { id: "asc" }],
}

const toCard = (s: CatalogServiceRow) => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  href: serviceHref(s.category.slug, s.slug),
  categoryName: label(s.category),
  providerId: s.providerId,
  providerName: s.provider.user.name || "Livo provider",
  price: num(s.price),
  durationMinutes: s.durationMinutes,
  rating: num(s.provider.ratingAvg),
  reviewsCount: s.provider.ratingCount,
  imageUrl: s.images[0] ? `/api/images/services/${s.images[0].id}` : null,
})

/** Category tree with counts; a parent counts its sub-categories' services too. */
async function loadCategories(): Promise<CatalogCategory[]> {
  const [rows, counts] = await Promise.all([repo.findActiveCategories(), repo.countServicesByCategory(VISIBLE_SERVICE)])
  const own = new Map(counts.map((c) => [c.categoryId, c._count._all]))
  const slugById = new Map(rows.map((r) => [r.id, r.slug]))
  const children = (id: string) => rows.filter((r) => r.parentId === id)
  return rows.map((r) => {
    const kids = children(r.id)
    return {
      id: r.id,
      slug: r.slug,
      name: label(r),
      description: r.description,
      iconKey: r.iconKey,
      type: r.type,
      parentSlug: r.parentId ? (slugById.get(r.parentId) ?? null) : null,
      serviceCount: (own.get(r.id) ?? 0) + kids.reduce((s, k) => s + (own.get(k.id) ?? 0), 0),
      children: kids.map((k) => ({ slug: k.slug, name: label(k), serviceCount: own.get(k.id) ?? 0 })),
    }
  })
}

async function loadOptions(categories: CatalogCategory[]): Promise<CatalogFilterOptions> {
  const [areas, priceBounds] = await Promise.all([repo.findActiveAreas(), repo.priceBounds(VISIBLE_SERVICE)])
  const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]))
  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, parentName: c.parentSlug ? (nameBySlug.get(c.parentSlug) ?? null) : null })),
    areas: areas.map((a) => ({ slug: a.slug, name: label(a) })),
    priceBounds,
  }
}

/** The category and all its sub-categories' ids (a parent page lists its children's services). */
const categoryIds = (c: CatalogCategory, all: CatalogCategory[]) => [c.id, ...all.filter((x) => x.parentSlug === c.slug).map((x) => x.id)]

async function servicePage(where: Prisma.ServiceWhereInput, sort: CatalogSort, page: number): Promise<CatalogServicePage> {
  const [rows, total] = await repo.findServicePage({ AND: [VISIBLE_SERVICE, where] }, ORDER[sort], (page - 1) * CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE)
  return { items: rows.map(toCard), total, page, perPage: CATALOG_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)) }
}

/** `GET /api/services` and the `/services` island: every filter is optional; unknown slugs simply match nothing. */
export async function listCatalogServices(query: CatalogQuery): Promise<CatalogServicePage> {
  const categories = query.category ? await loadCategories() : []
  const and: Prisma.ServiceWhereInput[] = []
  if (query.category) {
    const c = categories.find((x) => x.slug === query.category)
    and.push(c ? { categoryId: { in: categoryIds(c, categories) } } : { id: "__none__" })
  }
  if (query.q) {
    and.push({ OR: [{ title: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }, { category: { nameEn: { contains: query.q, mode: "insensitive" } } }] })
  }
  // A provider covers an area if they listed it, or listed no areas at all (whole city) — same as request matching.
  if (query.area) and.push({ provider: { OR: [{ areas: { some: { area: { slug: query.area, isActive: true } } } }, { areas: { none: {} } }] } })
  const { minPrice, maxPrice } = normalizePriceRange(query.minPrice, query.maxPrice)
  if (minPrice !== undefined || maxPrice !== undefined) and.push({ price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } })
  if (query.maxDuration !== undefined) and.push({ durationMinutes: { lte: query.maxDuration } })
  if (query.minRating !== undefined) and.push({ provider: { ratingAvg: { gte: query.minRating }, ratingCount: { gt: 0 } } })
  return servicePage({ AND: and }, query.sort, query.page)
}

/** `/services` at build / regeneration: filter options and the default listing. */
export async function getCatalogIndex(): Promise<CatalogIndex> {
  const categories = await loadCategories()
  const [options, initial] = await Promise.all([loadOptions(categories), servicePage({}, "recommended", 1)])
  return { options, initial }
}

/** A category page (`null` → 404). `page` beyond the last page is the caller's 404. */
export async function getCategoryPage(slug: string, page: number): Promise<CategoryPageData | null> {
  const all = await loadCategories()
  const category = all.find((c) => c.slug === slug)
  if (!category) return null
  const ids = categoryIds(category, all)
  const parent = category.parentSlug ? all.find((c) => c.slug === category.parentSlug) : undefined
  const [services, providerCount] = await Promise.all([servicePage({ categoryId: { in: ids } }, "recommended", page), repo.countProviders(ids)])
  return { category, parent: parent ? { slug: parent.slug, name: parent.name } : null, services, providerCount }
}

/** Every category with its page count — `generateStaticParams` and the sitemap. */
export async function getCategoryPaths(): Promise<{ slug: string; pageCount: number }[]> {
  const all = await loadCategories()
  return all.map((c) => ({ slug: c.slug, pageCount: Math.max(1, Math.ceil(c.serviceCount / CATALOG_PAGE_SIZE)) }))
}

/** The public image route: only photos of LIVE services. */
export function findPublicServiceImage(fileId: string) {
  return repo.findPublicServiceImage(fileId, VISIBLE_SERVICE)
}

/** `/category`: every top-level category with its sub-categories and live-service counts. */
export async function getCategoryDirectory(): Promise<CategoryDirectory> {
  return { categories: (await loadCategories()).filter((c) => !c.parentSlug) }
}

const RELATED = 3
const REVIEWS = 5

/**
 * `/services/[category]/[service]` (MK-02). Only a LIVE service is found. If the URL's category isn't the
 * service's own (it moved), answer "moved" so the page can 308 to the right URL — old links never 404
 * (CLAUDE.md §4.1 rule 11). Provider-written text is passed through the contact masker (SY-04): a phone
 * number in a public description or bio would take the deal off-platform (business analysis R1).
 */
export async function getServiceDetail(categorySlug: string, serviceSlug: string): Promise<ServiceLookup> {
  const s = await repo.findServiceBySlug(serviceSlug, VISIBLE_SERVICE)
  if (!s) return { kind: "missing" }
  const href = serviceHref(s.category.slug, s.slug)
  if (s.category.slug !== categorySlug) return { kind: "moved", href }

  const p = s.provider
  const [reviews, more, similar] = await Promise.all([
    repo.findProviderReviews(p.userId, REVIEWS),
    repo.findServices({ AND: [VISIBLE_SERVICE, { providerId: p.userId, id: { not: s.id } }] }, ORDER.recommended, RELATED),
    repo.findServices({ AND: [VISIBLE_SERVICE, { categoryId: s.categoryId, providerId: { not: p.userId } }] }, ORDER.recommended, RELATED),
  ])

  return {
    kind: "found",
    service: {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: maskContactDetails(s.description).text,
      price: num(s.price),
      durationMinutes: s.durationMinutes,
      images: s.images.map((i) => `/api/images/services/${i.id}`),
      href,
      category: { slug: s.category.slug, name: label(s.category), type: s.category.type },
      parent: s.category.parent ? { slug: s.category.parent.slug, name: label(s.category.parent) } : null,
      provider: {
        id: p.userId,
        name: p.user.name || "Livo provider",
        avatarUrl: p.user.avatarUrl,
        bio: p.bio ? maskContactDetails(p.bio).text : null,
        yearsExperience: p.yearsExperience,
        rating: num(p.ratingAvg),
        reviewsCount: p.ratingCount,
        completedJobs: p.completedCount,
        areas: p.areas.map((a) => label(a.area)),
        city: label(p.city),
        memberSince: p.createdAt.toISOString(),
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ? maskContactDetails(r.comment).text : null,
        reply: r.providerReply,
        customerFirstName: firstName(r.reviewer.name),
        createdAt: r.createdAt.toISOString(),
      })),
      moreFromProvider: more.map(toCard),
      similar: similar.map(toCard),
      updatedAt: s.updatedAt.toISOString(),
    },
  }
}
