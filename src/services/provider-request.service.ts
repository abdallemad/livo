import "server-only"
import { Prisma } from "@prisma/client"
import { providerDashboardRepository as ctxRepo } from "@/repositories/provider-dashboard.repository"
import { requestRepository, type ProviderRequestRow } from "@/repositories/request.repository"
import type { ProviderRequestListQuery } from "@/schemas/provider.schema"
import type { ProviderOption, ProviderRequestCard, ProviderRequestList } from "@/types/provider"
import { API_ROUTES } from "@/constants/api-routes"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { providerRequestRepository as detailRepo, type ProviderRequestDetailRow } from "@/repositories/provider-request.repository"
import type { ProviderQuoteValues } from "@/schemas/provider.schema"
import { signedPreview } from "@/services/file-upload.service"
import { pushStoredNotifications, type StoredNotification } from "@/services/notification.service"
import type { ProviderQuoteSentDto, ProviderRequestDetail } from "@/types/provider"
import { maskContactDetails } from "@/utils/contact-mask"
import { formatPrice } from "@/utils/format"
import { quoteSendBlockedReason, quoteSendMode, quoteValidUntil, quoteWithdrawBlockedReason } from "@/utils/provider-quote"
import { expandCategoryIds, requestMatchesProvider, type RequestScope } from "@/utils/request-matching"
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

// ---------------------------------------------------------------------------
// One request + sending a quote (PR-07) — docs/provider-request-detail-feature.md
// ---------------------------------------------------------------------------

/**
 * Who may open a request: a provider who already quoted it (any status — it's their history), or an APPROVED provider
 * it matches (rules 1–4; areas are ignored, like the "whole city" scope, so a link from the list always opens).
 * Everyone else gets a 404 — a request's existence isn't confirmed to strangers.
 */
function canView(r: ProviderRequestDetailRow, ctx: ProviderContext, now: Date) {
  if (r.quotes.length > 0) return true
  return requestMatchesProvider(
    { status: r.status, expiresAt: r.expiresAt, cityId: r.cityId, categoryId: r.categoryId, areaId: r.areaId },
    { verificationStatus: ctx.profile.verificationStatus, cityId: ctx.profile.cityId, categoryIds: ctx.categoryIds, areaIds: ctx.areaIds },
    ctx.categoryIds,
    now,
    "city",
  )
}

const sendCheck = (r: ProviderRequestDetailRow, ctx: ProviderContext, providerId: string, now: Date) => ({
  approved: ctx.profile.verificationStatus === "APPROVED",
  requestStatus: r.status,
  requestExpired: !!r.expiresAt && r.expiresAt <= now,
  existing: r.quotes[0]?.status ?? null,
  ownRequest: r.customerId === providerId,
})

function toDetail(r: ProviderRequestDetailRow, ctx: ProviderContext, providerId: string, now: Date): ProviderRequestDetail {
  const q = r.quotes[0] ?? null
  const description = maskContactDetails(r.description)
  return {
    id: r.id,
    title: r.title,
    description: description.text,
    descriptionMasked: description.masked,
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
    photos: r.media.map((f) => ({ id: f.id, url: API_ROUTES.provider.requestPhoto(r.id, f.id) })),
    myQuote: q
      ? {
          id: q.id,
          price: num(q.price),
          durationDays: q.durationDays,
          status: q.status,
          createdAt: q.createdAt.toISOString(),
          message: q.message,
          validUntil: q.validUntil?.toISOString() ?? null,
          booking: q.booking,
        }
      : null,
    sendBlockedReason: quoteSendBlockedReason(sendCheck(r, ctx, providerId, now)),
    sendMode: quoteSendMode(q?.status ?? null),
    withdrawBlockedReason: q ? quoteWithdrawBlockedReason(q.status, r.status) : "No quote to withdraw.",
  }
}

/** `GET /api/provider/requests/[id]` and the page's first snapshot; `null` → 404. */
export async function getRequestForProvider(providerId: string, id: string, now = new Date()): Promise<ProviderRequestDetail | null> {
  const [ctx, r] = await Promise.all([loadProviderContext(providerId), detailRepo.findDetail(id, providerId)])
  if (!ctx || !r || !canView(r, ctx, now)) return null
  return toDetail(r, ctx, providerId, now)
}

/**
 * `PUT /api/provider/requests/[id]/quote` (PR-07): send a quote, edit my waiting one, or send again after withdrawing /
 * expiry (same row — one quote per provider per request). The customer is notified (QUOTE_RECEIVED). Quotes move no money,
 * so they aren't audited (same as withdrawing).
 */
export async function sendQuote(providerId: string, requestId: string, values: ProviderQuoteValues, now = new Date()): Promise<ProviderQuoteSentDto> {
  const ctx = await loadProviderContext(providerId)
  if (!ctx) throw new NotFoundError("That request doesn't exist.")

  const sent = await detailRepo.transaction(async (tx) => {
    const r = await detailRepo.findDetail(requestId, providerId, tx)
    if (!r || !canView(r, ctx, now)) throw new NotFoundError("That request doesn't exist.")
    const blocked = quoteSendBlockedReason(sendCheck(r, ctx, providerId, now))
    if (blocked) throw new ConflictError(blocked)

    const existing = r.quotes[0] ?? null
    const mode = quoteSendMode(existing?.status ?? null)
    const data = { price: values.price, durationDays: values.durationDays ?? null, message: values.message ?? null, validUntil: quoteValidUntil(now, values.validDays) }
    let id: string
    if (!existing) {
      try {
        id = (await detailRepo.createQuote({ ...data, requestId, providerId, status: "PENDING" }, tx)).id
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ConflictError("You already sent a quote on this request. Reload to see it.")
        throw e
      }
    } else {
      const from = mode === "UPDATE" ? "PENDING" : { in: ["WITHDRAWN", "EXPIRED"] as ("WITHDRAWN" | "EXPIRED")[] }
      const extra = mode === "RESEND" ? { status: "PENDING" as const, createdAt: now } : {}
      if ((await detailRepo.updateQuote(existing.id, providerId, from, { ...data, ...extra }, tx)) === 0) {
        throw new ConflictError("Your quote or this request just changed. Reload to see the latest.")
      }
      id = existing.id
    }

    const notification: StoredNotification = {
      userId: r.customerId,
      type: "QUOTE_RECEIVED",
      title: mode === "UPDATE" ? `A provider updated their quote on "${r.title}"` : `New quote on "${r.title}"`,
      body: `${formatPrice(values.price)}${values.durationDays ? ` · ${values.durationDays} ${values.durationDays === 1 ? "day" : "days"}` : ""}. Compare quotes and choose one.`,
      payload: { requestId, quoteId: id },
    }
    await detailRepo.createNotification({ ...notification, payload: notification.payload ?? undefined }, tx)
    return { dto: { id, status: "PENDING" as const, mode }, notification }
  })

  // After the commit: the customer's bell + a live toast wherever they are in their dashboard (docs/notifications-feature.md).
  await pushStoredNotifications([sent.notification])
  return sent.dto
}

/** `GET /api/provider/requests/[id]/photos/[fileId]` — a 5-minute signed link, only for someone who may open the request. */
export async function getRequestPhotoUrlForProvider(providerId: string, requestId: string, fileId: string, now = new Date()): Promise<string> {
  const [ctx, r] = await Promise.all([loadProviderContext(providerId), detailRepo.findDetail(requestId, providerId)])
  if (!ctx || !r || !canView(r, ctx, now)) throw new NotFoundError("Photo not found.")
  const file = await detailRepo.findRequestPhoto(requestId, fileId)
  if (!file) throw new NotFoundError("Photo not found.")
  return signedPreview(file.key, file.mimeType)
}
