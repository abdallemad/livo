# Service cover images & the spotlight service card

Status: **built** (2026-11-05). Gives every fixed-price service a picture even before the provider uploads one, and
redesigns the public service card.

## Card design — `src/components/service/ServiceCard.tsx`

One component for every public service card: the landing page's **Popular services** (`PopularServices.tsx`), the
`/services` and category grids (`ServiceGrid.tsx`) and the design-system preview.

| State | Look |
|---|---|
| Default | Tall (`min-h-88`) navy → violet card, `rounded-[28px]`. White icon tile top-start (category icon), optional gradient badge top-end (`★ Most requested`), title + two-line blurb + price / duration / rating / provider at the bottom. With a cover photo, the photo fills the card under a navy wash so white text stays readable. |
| Hover / keyboard focus | Card lifts, photo zooms slightly, the text block slides up and a gradient **Book this service** pill appears (CSS `grid-rows` 0fr → 1fr). |
| Touch screens (`hover: none`) | The pill is always shown, since there is no hover. |
| Reduced motion | No lift, zoom or slide; the pill still appears. |

Rules kept:
- The whole card is **one `<a>`** (crawlable, one tab stop). The "button" is a styled `<span>`, never a nested control.
- Pure CSS, so it is a Server Component and pages stay static / ISR.
- The cover is a CSS background, not `<img>`: if the stock host is down the card just shows its navy design (no broken-image
  icon). The URL is JSON-quoted inside `url()`.
- On the landing page the first (most popular) service wears **Most requested**; the category fallback (no live services
  yet) uses the same card without a price, CTA "Explore" / "Request quotes".

Props: `service` (`href`, `title`, `description?`, `iconKey?`, `providerName?`, `price?`, `priceKind?`, `rating?`,
`reviewsCount?`, `duration?`, `imageUrl?`), `badge?`, `cta?` (default "Book this service").

## Data — `Service.imageUrl`

| Piece | Change |
|---|---|
| Schema | `Service.imageUrl String?` — an external stock/demo cover |
| Migration | `prisma/sql/2026-11-05-service-image-url.sql` (additive, `IF NOT EXISTS`), listed in `scripts/prebuild-db.cjs` |
| Pure rules | `src/utils/service-image.ts`: `serviceCoverUrl()`, `serviceGalleryUrls()`, `externalCoverUrl()` (only absolute `https:` URLs), `cardSummary()` |
| DTO | `CatalogServiceCard.summary` (masked, ~110 chars) is new; `imageUrl` = first upload, else the stock cover |
| Reads | `catalog.repository.ts` (cards + detail) and `booking-checkout.repository.ts` select `imageUrl` |
| Tests | `tests/utils/service-image.test.ts` |

**Order of precedence:** the provider's uploads (`File` rows under `uploads/services/`, streamed by
`/api/images/services/[id]`) always win → `Service.imageUrl` → no image. The service page gallery shows all uploads, or the
stock cover alone. Nothing in the app writes `imageUrl`; only the seed scripts do.

## Seeding random images — `npm run db:seed:images`

`prisma/seed-service-images.ts`:

```bash
npm run db:seed:images                     # fill services that have no cover yet
npm run db:seed:images -- --all            # overwrite every cover
npm run db:seed:images -- --all --shuffle  # overwrite with NEW random photos
npm run db:seed:images -- --dry-run        # print the plan, write nothing
npm run db:seed:images -- --provider=picsum|unsplash
```

| Provider | When | URL |
|---|---|---|
| **Lorem Picsum** (default) | no key needed | `https://picsum.photos/seed/livo-<slug>[-<shuffle token>]/800/600`: a random photo (Picsum's library comes from Unsplash), the same every time for the same seed |
| **Unsplash API** | `UNSPLASH_ACCESS_KEY` set in `.env` / `.env.local` | random landscape photos searched per trade (`plumbing` → "plumber", `electrical` → "electrician", `cleaning`, `ac`, `finishing`…; fallback "home repair"); one API call per trade (demo keys allow 50 requests/hour); hotlinks `images.unsplash.com` and pings `download_location` as the Unsplash guidelines ask. If a call fails, those services fall back to Picsum. |

It refuses with `NODE_ENV=production` unless `--allow-production` is passed (stock photos are demo data). `npm run db:seed`
also gives each mock service a Picsum cover (`imageUrl`), because its `seed/…` `File` rows have no real object behind them.
Public pages are ISR: new covers show within the hour, or right away after a redeploy / `npm run warm`.

Images are plain URLs on external hosts, so `next.config.mjs` needs no `remotePatterns` change (they're CSS backgrounds,
not `next/image`).
