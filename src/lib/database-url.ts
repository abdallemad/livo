import "server-only"

/**
 * Returns the pooled runtime URL with safe pool settings applied
 * (CLAUDE.md §6): a missing `connection_limit` or a value of 1 causes P2024
 * timeouts under concurrent rendering.
 */
export function getDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) return undefined

  try {
    const url = new URL(raw)
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "5")
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "30")
    return url.toString()
  } catch {
    return raw
  }
}
