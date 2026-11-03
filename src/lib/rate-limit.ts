import "server-only"

/**
 * A tiny in-memory fixed-window limiter, keyed per visitor. Good enough for the single-container VPS deploy
 * (CLAUDE.md §10): it stops one tab from burning the Gemini quota. With several instances each one counts on
 * its own — move to Redis/Postgres if the app is ever scaled out.
 */
export interface RateLimiter {
  /** `true` if this hit is allowed (and counted), `false` if the key is over its limit for the current window. */
  hit(key: string, now?: number): boolean
}

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>()
  return {
    hit(key, now = Date.now()) {
      const current = windows.get(key)
      if (!current || now - current.start >= windowMs) {
        // Bound memory: drop the oldest entries when a flood of distinct keys arrives.
        if (windows.size >= maxKeys) {
          for (const [k, w] of windows) {
            if (now - w.start >= windowMs || windows.size >= maxKeys) windows.delete(k)
            if (windows.size < maxKeys) break
          }
        }
        windows.set(key, { start: now, count: 1 })
        return true
      }
      if (current.count >= limit) return false
      current.count += 1
      return true
    },
  }
}
