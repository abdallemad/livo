# 2026-11-01 — Public catalog: services page with advanced filters, category pages

Details: [catalog-feature.md](../catalog-feature.md).

- **`/services`** (MK-02, MK-06): every category as a link with live-service counts, and all fixed-price services with
  **advanced filters** — search, category (incl. sub-categories), area, price range, duration, provider rating, sort — in a desktop
  sidebar / mobile sheet with removable chips. The page stays static: the default listing is server-rendered and filters fetch from
  the new public `GET /api/services`. Filtered URLs are `noindex`.
- **`/services/[category]`** and **`/page/[page]`**: SSG category pages with breadcrumb + JSON-LD, description, sub-categories,
  verified-provider count, a quote CTA for quote categories, services grid and real pagination links (`/page/1` → 308, past the end → 404).
- **`GET /api/images/services/[id]`**: public photos of live services only.
- `sitemap.xml` now lists every category page and its numbered pages.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (144/144; 8 new) pass.
- Found and fixed while writing: a copy line promised "new providers join every week" — removed (nobody said so).
- **Not verified with `next build`, in a browser or against a database:** this environment has no `.env` and the build prerenders these
  pages from the DB. Worth checking: `npm run build` lists `/services` as ◐ (not ƒ) and the category routes as ●; with the seed,
  `/services/plumbing` shows the plumbing and sub-category services, `/services?category=plumbing&maxPrice=300` returns
  `X-Robots-Tag: noindex, follow`, and `/services/plumbing/page/1` redirects.
