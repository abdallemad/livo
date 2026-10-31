/**
 * CSRF guard for cookie-authenticated API routes, run by `src/proxy.ts`.
 * A state-changing request (POST/PUT/PATCH/DELETE) to `/api/*` must come from
 * this origin. Webhooks are exempt — they authenticate by signature instead.
 * Pure and dependency-free so it can be unit tested.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const EXEMPT_PREFIXES = ["/api/webhooks/"]

export interface GuardInput {
  method: string
  pathname: string
  origin: string | null
  host: string | null
  allowedOrigins?: string[]
}

export function isCrossSiteApiWrite({ method, pathname, origin, host, allowedOrigins = [] }: GuardInput): boolean {
  if (!pathname.startsWith("/api/")) return false
  if (SAFE_METHODS.has(method.toUpperCase())) return false
  if (EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false
  if (!origin) return true

  try {
    const originUrl = new URL(origin)
    if (host && originUrl.host === host) return false
    return !allowedOrigins.some((allowed) => new URL(allowed).origin === originUrl.origin)
  } catch {
    return true
  }
}
