/**
 * Public origin for canonicals, sitemap, robots and payment return URLs.
 * Production MUST set NEXT_PUBLIC_SERVER_URL or every canonical points at localhost.
 */
export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SERVER_URL?.trim() || "http://localhost:3000"
  return value.replace(/\/+$/, "")
}

export function absoluteUrl(path = "/"): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}
