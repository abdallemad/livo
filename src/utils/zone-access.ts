/**
 * Who may enter which private zone (docs/SITEMAP.md §1 "Access rules").
 * Pure so the proxy (layer 1) and the zone layouts (layer 2) apply the SAME
 * rule, and so it can be unit-tested. Returns the path to send the visitor
 * to, or `null` to let them in. `/admin` is not here: non-admins get a 404
 * rewrite there, never a redirect (CLAUDE.md §5).
 */
export type PrivateZone = "account" | "provider"
type ZoneRole = "CUSTOMER" | "PROVIDER" | "ADMIN"

export const ZONE_ROOT: Record<PrivateZone, string> = { account: "/account", provider: "/provider" }

export function getZoneRedirect(
  zone: PrivateZone,
  viewer: { signedIn: boolean; role: ZoneRole | null },
  /** Path being requested, used as the post-sign-in return URL. */
  pathname: string = ZONE_ROOT[zone]
): string | null {
  if (!viewer.signedIn) return `/sign-in?redirect_url=${encodeURIComponent(pathname)}`
  // Signed in with Clerk but no DB row yet → finish the first-sign-in sync.
  if (!viewer.role) return "/auth-callback"
  // Admins may open every zone (support / QA).
  if (viewer.role === "ADMIN") return null
  if (zone === "account") return viewer.role === "CUSTOMER" ? null : "/provider"
  // Provider zone, wrong role → pick a role first.
  if (viewer.role !== "PROVIDER") return "/onboarding"
  // TODO(provider verification): once ProviderProfile.verificationStatus exists,
  // send non-ACTIVE providers to /provider/verification (except onboarding & verification).
  return null
}

export const zoneFromPath = (pathname: string): PrivateZone | null =>
  pathname === "/account" || pathname.startsWith("/account/")
    ? "account"
    : pathname === "/provider" || pathname.startsWith("/provider/")
      ? "provider"
      : null
