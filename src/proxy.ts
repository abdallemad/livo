import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isCrossSiteApiWrite } from "@/lib/api-guard"
import { getRoleById } from "@/services/auth.service"
import { apiFailure } from "@/types/api"

/**
 * Next 16 Proxy (formerly middleware), Node runtime, so it can query Prisma.
 *
 * 1. CSRF: cross-site writes to `/api/*` are rejected (webhooks exempt).
 * 2. `/admin*` and `/api/admin/*`: non-admins get a 404 — never confirm the
 *    dashboard exists. Route handlers still call `requireAdmin()`; this is
 *    one of three independent layers (CLAUDE.md §5).
 * 3. `?page=1` on public listings → 301 to the clean URL.
 */
const isAdminPage = createRouteMatcher(["/admin(.*)"])
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
    const role = userId ? await getRoleById(userId) : null
    if (role !== "ADMIN") {
      if (isAdminApi(request)) {
        return NextResponse.json(apiFailure("Not found.", "NOT_FOUND"), { status: 404 })
      }
      return NextResponse.rewrite(new URL("/__forbidden", request.url), { status: 404 })
    }
  }

  if (searchParams.get("page") === "1" && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone()
    url.searchParams.delete("page")
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
