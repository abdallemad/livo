# 2026-11-01 — `/category` page and the service page

Details: [catalog-feature.md](../catalog-feature.md).

- **`/category`** (new, listed in SITEMAP §2 first): every category with its sub-categories. The "Browse by category" grid was
  removed from `/services`, which now only lists services with the filters and links to `/category`. "Categories" added to the header
  and footer nav and to the sitemap. Category-page breadcrumbs now read Home › Categories › ….
- **`/services/[category]/[service]`** (MK-02): gallery, fixed price and duration, **Book now**, provider summary (no contact details),
  latest visible reviews, more from the provider, similar services, `Service` + `Offer` JSON-LD. Only live services render; a service
  that moved category 308s to its new URL. Provider-written text is passed through the contact masker (SY-04).

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (145/145; 1 new) pass.
- **Not verified with `next build` or in a browser:** no `.env` here. Worth checking: `/category` builds as ◐, `/services` no longer shows
  the category grid, and with the seed `/services/plumbing/<a plumbing service slug>` renders with Book now; the same slug under
  `/services/electrical/…` redirects.
