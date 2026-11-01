# Public provider profile — `/providers/[id]` (PR-04, PR-10, SY-04)

The provider's public page: who they are, what they do and where, live services, past work and customer reviews —
**never contact details** (SY-04). Listed in `docs/SITEMAP.md` §2.

## Rendering

- **ISR**: `revalidate = 3600`, `generateStaticParams → []` (rendered on first visit, then cached — CLAUDE.md §4.1 rule 5).
  `revalidateStorefront()` already runs after every write that changes it: provider settings, schedule, services, portfolio,
  review replies, and the admin's provider / user / review / service status changes.
- One `cache()`d loader shared by `generateMetadata` and the page.
- Only a **public provider** renders: `verificationStatus = APPROVED` **and** the user is `ACTIVE` (`PUBLIC_PROVIDER`). Anyone else —
  draft, pending, rejected, suspended, unknown id or a malformed id (checked before the DB) — is a **404**, so old links to a suspended
  provider don't leak their page.

## What's on the page

| Part | Source / rule |
|---|---|
| Breadcrumb | Home › Services › *name* — the visible `<ol>` and the `BreadcrumbList` JSON-LD share one list. |
| Header | Avatar, name, **Verified provider**, rating (stars only from `MIN_PROVIDER_REVIEWS_FOR_STARS` reviews — below that "N reviews so far" / "New on Livo"), specialties as links to their category pages, jobs done, years of experience, areas (or "All of *city*"), bio, member since. |
| Hire box | "See fixed-price services" (anchor) and **Request a quote** → `/account/requests/new?category=<first specialty>`. Explains that contact details are shared after booking. No phone, email, WhatsApp or address anywhere. |
| Working hours | Sat → Fri from `Availability` (PR-10), "Closed" days, Cairo time. Hidden entirely if the provider never set hours (a week of "Closed" would be untrue). |
| Services | The provider's **live** services (`VISIBLE_SERVICE`), up to 12, same cards as `/services`. |
| Past work | Portfolio items with at least one servable photo (`uploads/portfolio/` — the public image route serves nothing else), up to 12. |
| Reviews | Latest 10 **visible** customer reviews (hidden ones never count), with the provider's replies; a 5→1 breakdown when stars are shown. |

All provider-written text — bio, portfolio titles and descriptions, review comments and replies — passes through
`maskContactDetails` (SY-04).

**SEO**: title `Name — Specialty, Specialty and N more in City`, a facts-only meta description (`profileMetaDescription()`), canonical
self URL. JSON-LD `Person` with `knowsAbout`, `workLocation`, `memberOf` — no `contactPoint`, no `aggregateRating` (self-serving
review markup). Every public provider is in `sitemap.xml` with its `updatedAt`; a DB outage drops those entries instead of failing.

## Files

| Layer | File |
|---|---|
| Page | `src/app/(marketing)/providers/[id]/page.tsx` |
| UI | `src/components/catalog/ProviderProfileView.tsx` |
| Service | `src/services/public-provider.service.ts`; `getProviderServiceCards`, `getProviderReviews` added to `catalog.service.ts` (the service page now shares the review mapping, which also masks replies) |
| Repository | `src/repositories/public-provider.repository.ts` |
| Types | `PublicProviderProfile` in `src/types/catalog.ts` |
| Utils | `src/utils/provider-profile.ts` (`publicWeek`, `specialtiesPhrase`, `profileMetaDescription`); `providerJsonLd` in `utils/structured-data.ts` |
| Sitemap | `src/app/sitemap.ts` (`providerEntries`) |
| Tests | `tests/utils/provider-profile.test.ts`, `tests/seo/landing-seo.test.ts` (Person JSON-LD) |

No API route (read-only Server Component tree — the CLAUDE.md §2 exception), no schema change.

## Not done yet

- Reviews show the latest 10; a paginated `/providers/[id]/reviews` is a follow-up.
- Portfolio shows each item's first photo with a "+N more" count; a lightbox is a follow-up.
