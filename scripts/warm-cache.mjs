/**
 * `npm run warm [baseUrl] [--concurrency 2] [--timeout 30000] [--retries 2] [--limit N] [--slowest 10]`
 *
 * Reads /sitemap.xml and requests each <loc> once so ISR pages are rendered
 * before real visitors arrive. 2 concurrent by default (DB pool limit).
 * Exits 1 on any non-2xx — a broken sitemap URL is a bug, not noise.
 */
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : Number(args[index + 1])
}
const positional = args.find((arg, i) => !arg.startsWith("--") && !args[i - 1]?.startsWith("--"))

const baseUrl = (positional || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/+$/, "")
const concurrency = flag("concurrency", 2)
const timeout = flag("timeout", 30_000)
const retries = flag("retries", 2)
const limit = flag("limit", Infinity)
const slowestCount = flag("slowest", 10)

const headers = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
  // Not text/html: Clerk dev instances 307 HTML requests to a handshake and nothing warms.
  accept: "*/*",
}

async function request(url, attempt = 0) {
  const started = performance.now()
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) })
    await response.arrayBuffer()
    const retryable = response.status === 429 || response.status >= 500
    if (retryable && attempt < retries) return request(url, attempt + 1)
    return { url, status: response.status, ms: performance.now() - started }
  } catch (error) {
    if (attempt < retries) return request(url, attempt + 1)
    return { url, status: 0, ms: performance.now() - started, error: String(error) }
  }
}

const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`, { headers })).text()
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].trim().replace(/^https?:\/\/[^/]+/, baseUrl))
  .slice(0, limit)

console.log(`[warm] ${urls.length} urls from ${baseUrl}, concurrency ${concurrency}`)

const results = []
let cursor = 0
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++]
      const result = await request(url)
      results.push(result)
      console.log(`[warm] ${result.status} ${Math.round(result.ms)}ms ${url}`)
    }
  }),
)

const histogram = Object.groupBy(results, (r) => String(r.status))
const sorted = [...results].sort((a, b) => a.ms - b.ms)
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)].ms : 0

console.log("\n[warm] status:", Object.fromEntries(Object.entries(histogram).map(([k, v]) => [k, v.length])))
console.log(`[warm] median ${Math.round(median)}ms`)
console.log("[warm] slowest:")
for (const r of sorted.slice(-slowestCount).reverse()) console.log(`  ${Math.round(r.ms)}ms ${r.url}`)

if (results.some((r) => r.status < 200 || r.status >= 300)) process.exit(1)
