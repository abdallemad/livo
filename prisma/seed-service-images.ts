/**
 * Gives fixed-price services a random stock cover photo (docs/service-images-feature.md).
 *
 *   npm run db:seed:images                     → fill `Service.imageUrl` where it is empty
 *   npm run db:seed:images -- --all            → overwrite every service's cover
 *   npm run db:seed:images -- --all --shuffle  → overwrite with NEW random photos (Picsum gets a fresh seed)
 *   npm run db:seed:images -- --dry-run        → print what would change, write nothing
 *   npm run db:seed:images -- --provider=picsum|unsplash
 *
 * Providers:
 * - **Unsplash** (used when `UNSPLASH_ACCESS_KEY` is set): random landscape photos searched by the service's
 *   top-level category ("plumber", "electrician"…), so the picture matches the trade. Follows the Unsplash API
 *   guidelines: hotlinks `images.unsplash.com` and pings each photo's `download_location`.
 * - **Lorem Picsum** (default, no key): `https://picsum.photos/seed/<seed>/800/600` — a random photo (Picsum's
 *   library comes from Unsplash) that stays the same for the same seed, so re-runs are stable unless `--shuffle`.
 *
 * Only the `imageUrl` column is written. Uploaded photos (`File` rows) are never touched and always win on the page.
 * Refuses with NODE_ENV=production (stock photos are demo data) unless `--allow-production` is passed.
 *
 * Node runs this file directly (type stripping, Node 22.18+): erasable TypeScript only. Like `seed.ts`, it talks to
 * Prisma directly — seed scripts are outside the app's layer rules.
 */
import { PrismaClient } from "@prisma/client"

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const option = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1]

const OVERWRITE = flag("all")
const SHUFFLE = flag("shuffle")
const DRY_RUN = flag("dry-run")
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY?.trim() || ""
const PROVIDER = option("provider") ?? (UNSPLASH_KEY ? "unsplash" : "picsum")

const WIDTH = 800
const HEIGHT = 600

/** Search terms per top-level category slug; anything else uses the fallback. */
const UNSPLASH_QUERY: Record<string, string> = {
  plumbing: "plumber",
  electrical: "electrician",
  cleaning: "house cleaning",
  ac: "air conditioner",
  finishing: "house painting",
  carpentry: "carpenter",
  handyman: "handyman tools",
}
const FALLBACK_QUERY = "home repair"

type ServiceRow = { id: string; slug: string; title: string; imageUrl: string | null; category: { slug: string; parent: { slug: string } | null } }

const picsumUrl = (slug: string, token: string) => `https://picsum.photos/seed/${encodeURIComponent(`livo-${slug}${token ? `-${token}` : ""}`)}/${WIDTH}/${HEIGHT}`

type UnsplashPhoto = { urls: { raw: string }; links: { download_location: string } }

async function unsplashBatch(query: string, count: number): Promise<UnsplashPhoto[]> {
  const url = new URL("https://api.unsplash.com/photos/random")
  url.searchParams.set("query", query)
  url.searchParams.set("orientation", "landscape")
  url.searchParams.set("content_filter", "high")
  url.searchParams.set("count", String(Math.min(30, Math.max(1, count))))
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, "Accept-Version": "v1" } })
  if (!res.ok) throw new Error(`Unsplash ${res.status} for "${query}"`)
  return (await res.json()) as UnsplashPhoto[]
}

/** Unsplash asks apps to ping this when a photo is used; failures are ignored. */
async function trackUnsplashUse(photo: UnsplashPhoto) {
  await fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }).catch(() => undefined)
}

const unsplashUrl = (photo: UnsplashPhoto) => `${photo.urls.raw}&w=${WIDTH}&h=${HEIGHT}&fit=crop&auto=format&q=70`

async function main() {
  if (process.env.NODE_ENV === "production" && !flag("allow-production")) {
    throw new Error("Refusing to write stock photos with NODE_ENV=production (pass --allow-production to override).")
  }
  if (PROVIDER !== "picsum" && PROVIDER !== "unsplash") throw new Error(`Unknown --provider "${PROVIDER}" (picsum | unsplash).`)
  if (PROVIDER === "unsplash" && !UNSPLASH_KEY) throw new Error("--provider=unsplash needs UNSPLASH_ACCESS_KEY in .env / .env.local.")

  const db = new PrismaClient()
  try {
    const services: ServiceRow[] = await db.service.findMany({
      where: OVERWRITE ? {} : { imageUrl: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, title: true, imageUrl: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
    })
    if (!services.length) {
      console.log("[seed:images] nothing to do — every service already has a cover (use --all to overwrite).")
      return
    }

    const token = SHUFFLE ? Math.random().toString(36).slice(2, 8) : ""
    const urls = new Map<string, string>()

    if (PROVIDER === "unsplash") {
      // One API call per trade (rate limit: 50 requests/hour on a demo key), then hand photos out round-robin.
      const byQuery = new Map<string, ServiceRow[]>()
      for (const s of services) {
        const top = s.category.parent?.slug ?? s.category.slug
        const query = UNSPLASH_QUERY[top] ?? FALLBACK_QUERY
        byQuery.set(query, [...(byQuery.get(query) ?? []), s])
      }
      for (const [query, rows] of byQuery) {
        try {
          const photos = await unsplashBatch(query, rows.length)
          rows.forEach((s, i) => {
            const photo = photos[i % photos.length]
            if (!photo) return
            urls.set(s.id, unsplashUrl(photo))
            if (!DRY_RUN) void trackUnsplashUse(photo)
          })
        } catch (error) {
          console.warn(`[seed:images] ${(error as Error).message} — falling back to Picsum for ${rows.length} service(s).`)
        }
      }
    }
    for (const s of services) if (!urls.has(s.id)) urls.set(s.id, picsumUrl(s.slug, token))

    for (const s of services) {
      const next = urls.get(s.id)!
      console.log(`${DRY_RUN ? "[dry-run] " : ""}${s.slug.padEnd(32)} → ${next}`)
      if (!DRY_RUN) await db.service.update({ where: { id: s.id }, data: { imageUrl: next } })
    }
    console.log(`[seed:images] ${DRY_RUN ? "would update" : "updated"} ${services.length} service(s) via ${PROVIDER}.`)
    if (!DRY_RUN) console.log("[seed:images] Cached pages refresh within the hour (ISR); run `npm run warm` or redeploy to see them now.")
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(`[seed:images] ${(error as Error).message}`)
  process.exitCode = 1
})
