import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isCrossSiteApiWrite } from "@/lib/api-guard"
import { getGateById } from "@/services/auth.service"
import { apiFailure } from "@/types/api"
import { getZoneRedirect, zoneFromPath } from "@/utils/zone-access"

/**
 * Next 16 Proxy (formerly middleware), Node runtime, so it can query Prisma.
 *
 * 1. CSRF: cross-site writes to `/api/*` are rejected (webhooks exempt).
 * 2. `/admin*` and `/api/admin/*`: non-admins get a 404 — never confirm the
 *    dashboard exists. Route handlers still call `requireAdmin()`; this is
 *    one of three independent layers (CLAUDE.md §5).
 * 3. `/account*`, `/provider*`, `/onboarding`: redirect by role and
 *    onboarding status (docs/SITEMAP.md §1, docs/onboarding-feature.md; rule
 *    shared with the zone layouts in `utils/zone-access.ts`).
 * 4. `?page=1` on public listings → 301 to the clean URL.
 * 5. `/search?…` → `X-Robots-Tag: noindex, follow` (CLAUDE.md §4.1 rule 7).
 *
 * `/design-system-preview` is open in development and admin-only (404) in
 * production — it is a style guide, not a public page.
 */
const isAdminPage = createRouteMatcher(
  process.env.NODE_ENV === "production" ? ["/admin(.*)", "/design-system-preview(.*)"] : ["/admin(.*)"]
)
const isAdminApi = createRouteMatcher(["/api/admin(.*)"])

export default clerkMiddleware(async (auth, request) => {
  const { pathname, searchParams } = request.nextUrl

  if (
    isCrossSiteApiWrite({
      method: request.method,
      pathname,
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
      allowedOrigins: process.env.NEXT_PUBLIC_SERVER_URL ? [process.env.NEXT_PUBLIC_SERVER_URL] : [],
    })
  ) {
    return NextResponse.json(apiFailure("Cross-site request rejected.", "FORBIDDEN"), { status: 403 })
  }

  if (isAdminPage(request) || isAdminApi(request)) {
    const { userId } = await auth()
    const gate = userId ? await getGateById(userId) : null
    if (gate?.role !== "ADMIN") {
      if (isAdminApi(request)) {
        return NextResponse.json(apiFailure("Not found.", "NOT_FOUND"), { status: 404 })
      }
      return NextResponse.rewrite(new URL("/__forbidden", request.url), { status: 404 })
    }
  }

  const zone = zoneFromPath(pathname)
  if (zone) {
    const { userId } = await auth()
    const gate = userId ? await getGateById(userId) : null
    const target = getZoneRedirect(
      zone,
      {
        signedIn: !!userId,
        role: gate?.role ?? null,
        onboardingCompleted: gate?.onboardingCompleted ?? false,
        suspended: gate?.suspended ?? false,
      },
      pathname
    )
    if (target) return NextResponse.redirect(new URL(target, request.url))
  }

  if (searchParams.get("page") === "1" && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone()
    url.searchParams.delete("page")
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()
  if (pathname === "/search" && request.nextUrl.search) response.headers.set("X-Robots-Tag", "noindex, follow")
  return response
})

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
