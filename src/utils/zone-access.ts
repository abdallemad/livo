/**
 * Who may enter which gated zone (docs/SITEMAP.md §1 "Access rules",
 * docs/onboarding-feature.md). Pure so the proxy (layer 1) and the zone
 * layouts (layer 2) apply the SAME rule, and so it can be unit-tested.
 * Returns the path to send the visitor to, or `null` to let them in.
 * `/admin` is not here: non-admins get a 404 rewrite there, never a redirect
 * (CLAUDE.md §5).
 */
export type GatedZone = "account" | "provider" | "onboarding"
/** Kept for the layouts that only guard the two dashboards. */
export type PrivateZone = Exclude<GatedZone, "onboarding">
type ZoneRole = "CUSTOMER" | "PROVIDER" | "ADMIN"

export interface ZoneViewer {
  signedIn: boolean
  /** null = signed in with Clerk but no DB row yet. */
  role: ZoneRole | null
  onboardingCompleted: boolean
}

export const ZONE_ROOT: Record<GatedZone, string> = { account: "/account", provider: "/provider", onboarding: "/onboarding" }

const dashboardFor = (role: ZoneRole) => (role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/account")

export function getZoneRedirect(
  zone: GatedZone,
  viewer: ZoneViewer,
  /** Path being requested, used as the post-sign-in return URL. */
  pathname: string = ZONE_ROOT[zone]
): string | null {
  if (!viewer.signedIn) return `/sign-in?redirect_url=${encodeURIComponent(pathname)}`
  // Signed in with Clerk but no DB row yet → finish the first-sign-in sync.
  if (!viewer.role) return "/auth-callback"

  // The wizard: only for users who haven't finished it; never shown again after.
  if (zone === "onboarding") return viewer.onboardingCompleted ? dashboardFor(viewer.role) : null

  // Admins may open every dashboard zone (support / QA).
  if (viewer.role === "ADMIN") return null
  // Unfinished onboarding always goes back into the wizard. Public pages stay open, so nobody is trapped.
  if (!viewer.onboardingCompleted) return "/onboarding"
  if (zone === "account") return viewer.role === "CUSTOMER" ? null : "/provider"
  return viewer.role === "PROVIDER" ? null : "/account"
}

export function zoneFromPath(pathname: string): GatedZone | null {
  for (const zone of ["account", "provider", "onboarding"] as const) {
    const root = ZONE_ROOT[zone]
    if (pathname === root || pathname.startsWith(`${root}/`)) return zone
  }
  return null
}
