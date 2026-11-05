# 2026-11-05 — Spotlight service card, service cover images, Help pages

- **Service card redesign** (`components/service/ServiceCard.tsx`): navy → violet spotlight card with icon tile,
  "Most requested" badge and a hover-revealed "Book this service" pill; used on the landing page and every service grid.
  docs/service-images-feature.md.
- **Service cover images**: new `Service.imageUrl` column (`prisma/sql/2026-11-05-service-image-url.sql`), used when a
  service has no upload. `npm run db:seed:images` fills it with random Lorem Picsum photos, or Unsplash photos per trade
  when `UNSPLASH_ACCESS_KEY` is set. `npm run db:seed` now sets a cover on every mock service.
- **New pages**: `/become-provider`, `/how-it-works`, `/contact` designed in full; `/faq` and `/about` now have built-in
  content and always answer 200 (the admin StaticPage text is an extra block). docs/help-pages-feature.md.
- `SUPPORT_EMAIL` added to `constants/site.ts` (null = hidden).

Deploy: the migration runs in `prebuild`. After deploy, optionally `npm run db:seed:images` (refuses in production
without `--allow-production`).
