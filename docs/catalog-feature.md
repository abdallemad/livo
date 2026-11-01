# Public catalog — `/category`, `/services`, category pages, service pages, advanced filters (MK-02, MK-06)

The public service catalog: every category, every fixed-price service with **advanced filters**, and one SEO page
per category. Built to the static / ISR rules in CLAUDE.md §4 and the SEO rules in §11.

## Pages

| Route | Rendering | What it shows |
|---|---|---|
| `/category` | **static, ISR hourly** | Breadcrumb (Home › Categories); every top-level category as a real link (icon, live-service count or "Request quotes") with its sub-categories as links underneath; "Search all services"; a quote CTA. JSON-LD: `BreadcrumbList` + `ItemList` of categories. In the header and footer nav ("Categories") and the sitemap. |
| `/services` | **static, ISR hourly** (never reads `searchParams`) | Breadcrumb; "Browse categories" → `/category`; **all fixed-price services** with the filter island; "Can't find what you need? → Request a quote". JSON-LD: `BreadcrumbList`. (The category grid moved to `/category`.) |
| `/services/[category]` | **SSG** — every active slug in `generateStaticParams`; new categories render on first visit (`dynamicParams`) | Breadcrumb (Home › Categories › *parent* › Category), H1, the category's description, "*N* fixed-price services · *M* verified providers", sub-category links, a **Request a quote** card when the category takes quotes (`QUOTE` / `BOTH`, SRS 2.2), the services (12 per page, real links to `/services/<category>/<service>`), real pagination links, "Filter by price, area, rating" → `/services?category=…`. JSON-LD: `BreadcrumbList` + `ItemList` of `Service` + `Offer` (EGP). |
| `/services/[category]/page/[page]` | SSG for every existing page | Same view, page N. `/page/1` → **308** to the clean URL; malformed, > 1000 or past the last page → **404**; title "… — Page N", self-canonical. |

| `/services/[category]/[service]` | **ISR** — `generateStaticParams → []`, rendered on first visit, cached hourly (CLAUDE.md §4.1 rule 5) | Breadcrumb (Home › Categories › *parent* › Category › Service); photo gallery; category, title, description; three trust points (held payment, verified provider, pick the time); a sticky box with the **fixed price**, duration, one amber **Book now** → `/account/book/[serviceId]`, and "Request a quote" for categories that take quotes; **Your provider** (photo, name, verified mark, rating, jobs done, years, areas or "All of *city*", bio, member since → `/providers/[id]`); the provider's 5 latest **visible** customer reviews with replies; **More from** the provider; **Similar** services from other providers (3 each). JSON-LD: `BreadcrumbList` + `Service` with `Offer` (EGP), `areaServed`, provider by name — no `aggregateRating` (the rating is the provider's, not the service's). |

A service page only renders a **live** service. If the service's category changed, the old URL answers **308** to the new one (CLAUDE.md §4.1 rule 11); anything else is a 404. Provider-written text (description, bio, review comments) passes through `utils/contact-mask.ts` so a phone number or email never reaches a public page (SY-04, business analysis R1); the provider's phone and email are never selected.

A parent category lists its sub-categories' services too; a quote-only category shows the quote path instead of an empty grid.

## Advanced filters (`/services`)

| Filter | URL key | Rule |
|---|---|---|
| Search | `q` | title, description or category name contains it |
| Category | `category` (slug) | that category **and its sub-categories** |
| Area | `area` (slug) | the provider covers it — lists it, or lists no areas (whole city; same rule as request matching) |
| Price | `minPrice`, `maxPrice` | EGP, inclusive; a min above the max is swapped |
| Takes at most | `maxDuration` | 1, 2 or 4 hours |
| Provider rating | `minRating` | 3+, 4+, 4.5+ (providers with at least one review) |
| Sort | `sort` | Recommended (rating, then reviews, then newest), price ↑ / ↓, best rated, newest |
| Page | `page` | 12 per page |

- Desktop: a sticky sidebar. Mobile: a **Filters (n)** sheet. Active filters show as removable chips with **Clear all**.
  Price is applied on blur / Enter; everything else at once.
- **How it stays static** (CLAUDE.md §4.1 rules 6–8): the page renders the categories and the default listing from the DB at
  build / regeneration and passes them to the island as `initialData` — no API call on a first visit. The island reads the
  filters from the URL (`useUrlQuery`, Suspense **fallback = the same markup with no filter selected**, so crawlers and the first
  paint get every link) and fetches anything else from **`GET /api/services`**, the same Zod schema on both sides
  (`catalogQuerySchema`; a blank field is "no filter", never 0).
- **SEO**: `/services?…` answers `X-Robots-Tag: noindex, follow` (proxy, like `/search`); `?page=1` already 301s to the clean URL.
  The crawlable listings are `/services` and the category pages; `/api/` is disallowed in robots.txt.

## Visibility

Every public read goes through **`VISIBLE_SERVICE`** (`services/admin-catalog.service.ts`, docs/admin-catalog-feature.md): switched
on by the provider, not hidden by an admin, provider `APPROVED` with an `ACTIVE` account, category and its parent active. Counts,
price bounds, listings, category pages and images all use it, so a service that isn't live never appears. Provider cards show the
public name and rating only (SY-04). Inactive categories (or children of inactive parents) have no page (404).

## Public service images — `GET /api/images/services/[id]`

Service photos are private R2 objects. This route streams one **only if** its key is under `uploads/services/` and it belongs to a
**live** service; otherwise 404 (CLAUDE.md §7). `cache-control: public, max-age=3600, s-maxage=86400` (not `immutable`: a service can
be hidden later). Allowed in robots.txt (`/api/images/`). Reads use the new `getPrivateObject()` in `lib/r2.provider.ts`. Without R2
configured, cards fall back to the placeholder icon only if the service has no photo — otherwise the image 404s.

## Cache & sitemap

- Hourly ISR on all three routes; every admin / provider catalog write already calls `revalidateStorefront()`
  (`revalidatePath("/", "layout")`), which covers them. No `unstable_cache` is used.
- `sitemap.ts` now lists every category page and its numbered pages (`getCategoryPaths`); a DB outage logs and degrades to the
  static entries. Filtered views stay out.

## Files

| Layer | File |
|---|---|
| Schema | `src/schemas/catalog.schema.ts` |
| DTOs | `src/types/catalog.ts` |
| Repository | `src/repositories/catalog.repository.ts` |
| Service | `src/services/catalog.service.ts` |
| Routes | `api/services/route.ts` (public), `api/images/services/[id]/route.ts` (public) |
| Utils + tests | `utils/catalog.ts` (URLs, page segment, filters, durations), JSON-LD in `utils/structured-data.ts`; `tests/utils/catalog.test.ts`, `catalog-schema.test.ts` |
| Hook | `src/hooks/use-catalog.ts` (`catalogKeys`) |
| UI | `components/catalog/{ServiceBrowser,FilterPanel,ServiceGrid,CategoryTile,CategoryView,ServiceDetailView,Crumbs}.tsx`; reuses `components/service/ServiceCard.tsx` |
| Pages | `(marketing)/category/page.tsx`, `(marketing)/services/page.tsx`, `(marketing)/services/[category]/{page.tsx,load.ts}`, `(marketing)/services/[category]/page/[page]/page.tsx`, `(marketing)/services/[category]/[service]/page.tsx` |
| Infra | `lib/r2.provider.ts` (`getPrivateObject`), `proxy.ts` (noindex `/services?…`), `app/sitemap.ts` |

No schema change and no migration.

## Not done / follow-ups

- **Provider profile** `/providers/[id]` and the booking wizard `/account/book/[serviceId]` (where **Book now** leads) are still placeholders.
- The home page's category tiles are still hard-coded and link to `/services`; switch them to the real categories.
- `/search` (MK-06) is still a placeholder — `/services` filters cover search for now; it could redirect there.
- A service whose slug is literally `page` would be shadowed by `/services/<category>/page/…`; slugs come from titles, so it's unlikely.
- Images go through `<img>`; move to the `next/image` wrapper with `srcSet` (CLAUDE.md §9) once R2's public host is decided.
