/**
 * The matching engine (SY-01, PR-06) — which open quote requests a provider sees on
 * `/provider/requests` and the dashboard. Pure; the service turns the same rules into a
 * Prisma `where` (docs/provider-dashboard-requests-feature.md). Rules:
 *
 *  1. The provider is **APPROVED** (SRS Flow 3: requests only after activation).
 *  2. The request is **OPEN** and not past `expiresAt` (BR-05).
 *  3. Same **city** as the provider (one city at launch, A1).
 *  4. **Category**: one of the provider's categories, or a sub-category of one (a "Plumbing"
 *     provider sees "Leak repair" requests). Not upwards: a tiler doesn't get every "Finishing" job.
 *  5. **Area** (scope "my areas"): one of the provider's work areas, or a request with no area
 *     (whole city). A provider with no areas listed covers the whole city. Scope "whole city"
 *     drops this rule — useful while the market is thin (business analysis §6.1).
 *  6. Not already quoted by this provider (those are on the "Quoted" tab).
 */

export type RequestScope = "areas" | "city"

export interface MatchProvider {
  verificationStatus: string
  cityId: string
  categoryIds: string[]
  areaIds: string[]
}

export interface MatchRequest {
  status: string
  expiresAt: Date | null
  cityId: string
  categoryId: string
  areaId: string | null
}

/** The provider's own categories plus every direct sub-category of them. */
export function expandCategoryIds(own: string[], categories: { id: string; parentId: string | null }[]) {
  const set = new Set(own)
  for (const c of categories) if (c.parentId && set.has(c.parentId)) set.add(c.id)
  return [...set]
}

export function requestMatchesProvider(
  request: MatchRequest,
  provider: MatchProvider,
  expandedCategoryIds: string[],
  now: Date,
  scope: RequestScope = "areas",
): boolean {
  if (provider.verificationStatus !== "APPROVED") return false
  if (request.status !== "OPEN") return false
  if (request.expiresAt && request.expiresAt <= now) return false
  if (request.cityId !== provider.cityId) return false
  if (!expandedCategoryIds.includes(request.categoryId)) return false
  if (scope === "areas" && provider.areaIds.length > 0 && request.areaId !== null && !provider.areaIds.includes(request.areaId)) return false
  return true
}
