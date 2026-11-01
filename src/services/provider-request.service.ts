import "server-only"
import type { Prisma } from "@prisma/client"
import { providerDashboardRepository as ctxRepo } from "@/repositories/provider-dashboard.repository"
import { requestRepository, type ProviderRequestRow } from "@/repositories/request.repository"
import type { ProviderRequestListQuery } from "@/schemas/provider.schema"
import type { ProviderOption, ProviderRequestCard, ProviderRequestList } from "@/types/provider"
import { expandCategoryIds, type RequestScope } from "@/utils/request-matching"
import { zonedDaysBetween } from "@/utils/zoned-time"

/**
 * Available requests for a provider (PR-06, SY-01, docs/provider-dashboard-requests-feature.md).
 * The matching rules are `utils/request-matching.ts`; `matchWhere()` below is the SAME rules as a
 * Prisma filter (keep them in step — the util is the tested spec). The provider id always comes
 * from the session (`requireProvider()` in the route, the zone gate on pages).
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr

export type ProviderContext = NonNullable<Awaited<ReturnType<typeof loadProviderContext>>>

/** Profile + expanded categories + filter options, or `null` when the user has no provider profile (an admin). */
export async function loadProviderContext(providerId: string) {
  const [profile, categories] = await Promise.all([ctxRepo.findContext(providerId), ctxRepo.findCategories()])
  if (!profile) return null
  const own = profile.categories.map((c) => c.categoryId)
  const categoryIds = expandCategoryIds(own, categories)
  const allowed = new Set(categoryIds)
  const categoryOptions: ProviderOption[] = categories.filter((c) => allowed.has(c.id) && c.isActive).map((c) => ({ id: c.id, name: label(c) }))
  const areaOptions: ProviderOption[] = profile.areas.map((a) => ({ id: a.area.id, name: label(a.area) }))
  return { profile, categoryIds, areaIds: areaOptions.map((a) => a.id), categoryOptions, areaOptions }
}

/** `utils/request-matching.ts` rules 2–5 as a Prisma filter. */
function matchWhere(ctx: ProviderContext, scope: RequestScope, now: Date): Prisma.ServiceRequestWhereInput {
  const and: Prisma.ServiceRequestWhereInput[] = [
    { status: "OPEN" },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    { cityId: ctx.profile.cityId },
    { categoryId: { in: ctx.categoryIds } },
  ]
  if (scope === "areas" && ctx.areaIds.length > 0) and.push({ OR: [{ areaId: null }, { areaId: { in: ctx.areaIds } }] })
  return { AND: and }
}

/** Rule 6: the "new" tab only shows requests this provider hasn't quoted. */
export function newRequestsWhere(ctx: ProviderContext, scope: RequestScope, now: Date): Prisma.ServiceRequestWhereInput {
  return { AND: [matchWhere(ctx, scope, now), { quotes: { none: { providerId: ctx.profile.userId } } }] }
}

const ORDER: Record<ProviderRequestListQuery["sort"], Prisma.ServiceRequestOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  expiring: [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }],
  budget: [{ budget: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }],
}

export function toProviderRequestCard(r: ProviderRequestRow, ctx: ProviderContext, now: Date): ProviderRequestCard {
  const q = r.quotes[0]
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: label(r.category),
    parentCategory: r.category.parent ? label(r.category.parent) : null,
    area: r.area ? label(r.area) : null,
    city: label(r.city),
    budget: r.budget ? num(r.budget) : null,
    preferredDate: r.preferredDate?.toISOString() ?? null,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    postedDaysAgo: Math.max(0, -zonedDaysBetween(now, r.createdAt)),
    expiresInDays: r.expiresAt ? zonedDaysBetween(now, r.expiresAt) : null,
    photoCount: r._count.media,
    quoteCount: r._count.quotes,
    outsideMyAreas: ctx.areaIds.length > 0 && r.areaId !== null && !ctx.areaIds.includes(r.areaId),
    myQuote: q
      ? { id: q.id, price: num(q.price), durationDays: q.durationDays, status: q.status, createdAt: q.createdAt.toISOString() }
      : null,
  }
}

const empty = (query: ProviderRequestListQuery) => ({
  items: [],
  total: 0,
  page: query.page,
  perPage: query.perPage,
  pageCount: 1,
  counts: { new: 0, quoted: 0 },
})

export async function listRequestsForProvider(providerId: string, query: ProviderRequestListQuery, now = new Date()): Promise<ProviderRequestList> {
  const ctx = await loadProviderContext(providerId)
  if (!ctx) return { ...empty(query), eligibility: "NO_PROFILE", verificationStatus: null, categories: [], areas: [] }
  const base = { verificationStatus: ctx.profile.verificationStatus, categories: ctx.categoryOptions, areas: ctx.areaOptions }
  // SRS Flow 3: requests only after the account is activated.
  if (ctx.profile.verificationStatus !== "APPROVED") return { ...empty(query), ...base, eligibility: "NOT_APPROVED" }

  const quotedWhere: Prisma.ServiceRequestWhereInput = { quotes: { some: { providerId } } }
  const filters: Prisma.ServiceRequestWhereInput[] = []
  if (query.categoryId) filters.push({ categoryId: query.categoryId })
  if (query.q) {
    filters.push({ OR: [{ title: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }] })
  }
  const tabWhere = query.tab === "quoted" ? quotedWhere : newRequestsWhere(ctx, query.scope, now)
  const where: Prisma.ServiceRequestWhereInput = { AND: [tabWhere, ...filters] }

  const [[rows, total], newCount, quotedCount] = await Promise.all([
    requestRepository.findProviderPage(providerId, where, ORDER[query.sort], (query.page - 1) * query.perPage, query.perPage),
    requestRepository.count(newRequestsWhere(ctx, query.scope, now)),
    requestRepository.count(quotedWhere),
  ])

  return {
    items: rows.map((r) => toProviderRequestCard(r, ctx, now)),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts: { new: newCount, quoted: quotedCount },
    eligibility: "OK",
    ...base,
  }
}
