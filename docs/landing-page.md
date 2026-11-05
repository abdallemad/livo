# Landing page `/` — trust-focused (MK-01)

The home page's one job: make a skeptical customer trust a platform they've never heard of. English, LTR, mobile-first, USD.
Static / ISR (`revalidate = 3600`), built and verified with `npm run build` against the seed (`/` = ○ static, 1h).

## Sections (in order)

| # | Section | File (`components/marketing/`) | Data | When empty |
|---|---|---|---|---|
| 1 | Header — logo, grouped hover dropdowns (Services + live categories / For providers / Help — `docs/navigation.md`), `AccountControls` island | `layout/AppHeader.tsx`, `layout/NavMenu.tsx` | top-level categories (`getNavCategories`) | static links only |
| 2 | Hero — the one H1, launch city + services, **Book a service** (amber) / Join as a provider, service + area search | `Hero.tsx` | areas (`getSearchAreas`) | "All of {city}" only |
| 2b | Trust strip — 4 promises | `TrustStrip.tsx` | constants | — |
| 3 | Popular services — spotlight cards (`service/ServiceCard.tsx`, docs/service-images-feature.md): cover photo, category icon, title, blurb, "From $X", duration, "Most requested" on the first, hover reveals "Book this service" → service page | `PopularServices.tsx` | `getPopularServices` (LIVE only) | real **category cards without prices** (same card); hidden if no categories |
| 4 | How it works — 2 tabs (client island), both panels `keepMounted` in the HTML | `HowItWorks.tsx` | constants | — |
| 5 | **Why trust Livo** — 4 cards (strongest visual weight), sample verified badge, privacy note, "Our policies" link | `WhyTrust.tsx` | constants; link only if the `policies` StaticPage is published | link hidden |
| 6 | Meet our providers — 3–4 real approved providers: photo, specialty, years, portfolio thumbnail, verified badge; stars only with ≥ 5 reviews | `MeetProviders.tsx` | `landing.service` | **hidden** below 3 providers |
| 7 | Real work gallery — portfolio photos labelled with the provider's specialty and area | `WorkGallery.tsx` | `landing.service` | **hidden** below 3 photos |
| 8 | Social proof — "Now live in {city}", plus rating / providers / jobs only above thresholds | `SocialProof.tsx` | `visibleProof()` | just the launch message |
| 9 | Where your money is — 5-step timeline, footnote "applies to online payments" | `MoneyFlow.tsx` | constants | — |
| 10 | FAQ — Base UI accordion, answers `keepMounted` + `hiddenUntilFound` (in the HTML), `FAQPage` JSON-LD | `LandingFaq.tsx` | constants | — |
| 11 | Provider recruitment band | `ProviderBand.tsx` | constants | — |
| 12 | Final CTA — repeats Book a service | `FinalCta.tsx` | constants | — |
| 13 | Footer — About, Contact, FAQ, Terms, Privacy, Policies, Services, Categories…, support phone / WhatsApp, social links, © | `layout/AppFooter.tsx` | constants | phone / WhatsApp / social **render only when set** |

Below-the-fold bands use `defer-render` (`content-visibility: auto`, in `globals.css`). All layout uses logical utilities
(`ms-`, `pe-`, `text-start`). The page is animated — see [Motion](#motion).

## Motion

The landing page is the one place with expressive animation (the `motion` package — formerly Framer Motion — plus a little
CSS); the rest of the app follows the calm rule in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) §10.

| Where | Animation | How |
|---|---|---|
| Hero `<h1>` | words rise in one after another (blur → sharp) at first paint | **CSS** `word-in` keyframes via `SplitWords` — it's the LCP element, so it must not wait for hydration, and it starts at opacity 0.15 so the browser counts its first paint |
| Hero subtitle, buttons, search | rise in, 350 / 500 / 650 ms after | CSS `rise-in` |
| Hero background | two soft violet / amber glows drifting slowly | `HeroBackdrop` (`m.div`, 14–17 s loops), `aria-hidden` |
| Every section `<h2>` | word-by-word rise when it scrolls into view (once) | `AnimatedTitle` |
| Trust strip, popular services / categories, why-trust cards, providers, work gallery, provider benefits | cards appear one after another; services, categories, trust cards, providers and photos lift a little on hover | `StaggerList` / `StaggerItem` |
| How it works (tabs), money flow, FAQ | the whole block fades and rises in | `Reveal` (the tabs' hidden panel would never trigger per-item animation) |
| Final CTA | fades and zooms in gently | `Reveal scale` |
| Social proof numbers | count up from 0 when seen | `CountUp` (server HTML holds the real number) |

Rules kept:

- **Content is in the server HTML** — titles are real text (words split into spans, `aria-label` with the full sentence for
  screen readers), numbers are the real values; animation only changes style. Crawlers and screen readers see it all.
- **Reduced motion**: `MotionProvider` sets `MotionConfig reducedMotion="user"` (no movement, fades only) and the CSS
  keyframes are off under `prefers-reduced-motion`; `CountUp` shows the final number.
- **Weight**: `LazyMotion` + `domAnimation` with `m.*` components (`strict`), so only the needed features ship. The page
  itself stays a static / ISR Server Component; the motion pieces are small client islands.
- Below-the-fold content starts hidden until it scrolls in, which needs JavaScript; without JS it stays at its initial
  (faded) style but is still in the HTML.

Files: `src/components/motion/{MotionProvider,AnimatedTitle,Reveal,CountUp,HeroBackdrop}.tsx`, `split-words.tsx`;
keyframes `word-in` / `rise-in` in `src/app/globals.css`; wired in `src/components/marketing/*` and `(marketing)/page.tsx`.

## Data sources & visibility

`src/services/landing.service.ts` → `getLandingData()` (React `cache()`), called from the Server Component at build /
regeneration (CLAUDE.md §2 read-only exception). The page never reads the request. Visibility is inside the queries:

- Services: `VISIBLE_SERVICE` (switched on, not admin-hidden, provider APPROVED + ACTIVE, category and parent active) via
  `catalog.service.ts` (`getPopularServices`, `getCategoryDirectory`, `getSearchAreas`).
- Providers and gallery: `PUBLIC_PROVIDER` = `verificationStatus = APPROVED` **and** `user.status = ACTIVE`
  (`repositories/landing.repository.ts`). Never selects phone or email.
- Stats: visible customer reviews only (count + average), approved providers, bookings COMPLETED / CLOSED.
- Photos: only files the public image routes will serve (key prefix `uploads/services/` / `uploads/portfolio/`), so a card never links a
  404. Public routes: `/api/images/services/[id]` (live services) and **new** `/api/images/portfolio/[id]` (public providers).
- Images go through **`components/shared/public-image.tsx`** (CLAUDE.md §9): `getImageProps` → `srcSet` + `sizes`, lazy unless `priority`,
  layered fallback optimized → raw route → neutral placeholder.
- English display: every name uses `nameEn ?? nameAr`.

## Trust-claim rules (enforced by `tests/seo/landing-seo.test.ts`)

All trust copy lives in `src/constants/trust.ts`; identity, launch scope and contact in `src/constants/site.ts`.

1. Claim only what the product does: provider verification (ID + selfie + admin review), online payments held until the customer
   confirms (BR-08), visible fixed prices, explicit approval of project price changes (BR-07), dispute review by our team (AD-05), phone
   numbers hidden until a booking is confirmed (BR-02, SY-04).
2. **No** warranty, money-back guarantee or refund terms — a test fails if those words appear in the trust copy.
3. Payment protection is always scoped to **online** payments (cash is supported) — also tested.
4. Numbers only from real data, only above `MIN_REVIEWS_TO_SHOW = 20`, `MIN_PROVIDERS_TO_SHOW = 10`, `MIN_COMPLETED_JOBS_TO_SHOW = 50`;
   provider stars need `MIN_PROVIDER_REVIEWS_FOR_STARS = 5`; providers section `MIN_FEATURED_PROVIDERS = 3`; gallery `MIN_GALLERY_IMAGES = 3`
   (`utils/trust.ts`, tested).
5. Undefined policies (no-shows, refunds, warranty, cancellation window) are answered "case by case through our dispute process", each
   with a `TODO: confirm` comment in `trust.ts`.

## SEO

- `generateMetadata` → `landingMetadata()` in `utils/seo-metadata.ts` (pure, tested): absolute title, canonical `/`, relative OG URL.
- JSON-LD: `Organization` + `WebSite` (with `SearchAction` → `/services?q=`) + `FAQPage` built from the same FAQ entries the accordion
  renders (`utils/structured-data.ts`, tested).
- `sitemap.ts`: `/`, the always-200 pages, and the **published** StaticPage routes only (never a 404 in the sitemap).

## Static pages backed by `StaticPage`

`/about`, `/terms`, `/privacy`, `/faq` and the new `/policies` (added to SITEMAP §2) render the published row of the same slug
(`services/static-page.service.ts`), re-sanitised with `sanitize-html` (`utils/sanitize.ts`, tested: no scripts / handlers / `javascript:`).
Missing or unpublished → a graceful 404. ISR hourly. `/contact` is unchanged (still a placeholder).

## Placeholders to confirm (`TODO: confirm`)

`LAUNCH_CITY` (Cairo — the seed's only active city), `LAUNCH_CATEGORIES`, `SUPPORT_PHONE`, `SUPPORT_WHATSAPP`, `SOCIAL_LINKS` (all
empty → hidden), the `policies` StaticPage (not seeded → the footer link 404s and the trust-section link is hidden until it's published),
the FAQ policies above, and "Pay in stages" in How it works (staged payments, CU-17, aren't in the booking UI yet).
