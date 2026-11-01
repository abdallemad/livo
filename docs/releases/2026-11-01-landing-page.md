# 2026-11-01 — Trust-focused landing page

Details: [landing-page.md](../landing-page.md).

- New `/`: hero with service + area search, trust strip, popular services (category fallback), how it works (2 tabs), **Why trust
  Livo**, meet our providers, real work gallery, social proof (thresholds), where your money is, FAQ (+ FAQPage JSON-LD), provider band,
  final CTA. Static / ISR; every DB section hides or falls back when empty; no invented numbers or testimonials.
- `constants/trust.ts` (all trust copy + thresholds) and launch / contact constants in `constants/site.ts` (placeholders marked TODO).
- New public `/api/images/portfolio/[id]`; the image wrapper `components/shared/public-image.tsx`; `defer-render` bands.
- `/about`, `/terms`, `/privacy`, `/faq` and new `/policies` now render published `StaticPage` content (sanitised) or 404; the sitemap
  lists only published ones. Footer gains Policies, support contacts and social links (shown only when set).
- Header nav is Services / How it works / Become a provider; "Categories" moved to the footer.
- **Fix to the catalog (previous change):** cards and the service page now only reference photos the public image route serves, so seeded
  or legacy files never render as broken images.
- New dependency: `sanitize-html` (+ types).

No schema change and no migration.

## Verification

- `npm run lint`, `npm test` (157/157; 12 new), and **`npm run build` against a local PostgreSQL loaded with the seed** (migrations applied,
  `prisma migrate diff` empty): `/` builds as ○ static (1h), category pages as ●, no warnings.
- Production server smoke test with the seed: `/`, `/services`, `/category`, category pages, `/faq`, `/about`, `/sitemap.xml` → 200;
  `/services/plumbing/page/1` → 308; past-the-end page → 404; `/policies` (unpublished) → 404; `/services?q=…` → `X-Robots-Tag: noindex, follow`.
- Landing HTML: one H1, FAQ answers and both How-it-works panels present, Organization + WebSite + FAQPage JSON-LD; with the seed the gallery
  hides (no real photos) and no social-proof numbers show (below thresholds).
- Screenshots reviewed in light, dark and mobile. Clerk ran with dummy keys, so the account island wasn't exercised.
