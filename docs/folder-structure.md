# Folder structure

The authoritative rules are in `CLAUDE.md` §2–§3; this is the map of what exists today.

```
prisma/              schema.prisma, seed.ts, sql/ (dated idempotent migrations: 2026-11-01-schema-baseline, 2026-11-01-onboarding)
scripts/             prebuild-db.cjs, build-with-deployment-id.mjs, prepare-standalone.mjs,
                     deployment-id.mjs, warm-cache.mjs, archive/ (one-offs)
tests/               node:test suites — api/, utils/, ui/ (RTL class guard), onboarding/, prelaunch/ + alias loader
docs/                SITEMAP.md, DESIGN-SYSTEM.md, srs.md, business-analysis, api-conventions.md, tech-stack.md, onboarding-feature.md, releases/
src/
  proxy.ts           Clerk + CSRF guard + /admin 404 gate + /account & /provider role redirects
                     + ?page=1 redirect + /search noindex header
  app/
    layout.tsx       <html lang="ar" dir="rtl">, fonts, ClerkProvider > DirectionProvider > ThemeProvider > QueryProvider
    (marketing)/     header shell, public pages (SITEMAP §2)   — static / ISR / SSG
    (app)/account/   customer sidebar shell (SITEMAP §3)       — dynamic, noindex
    (provider)/provider/ provider sidebar shell (SITEMAP §4)   — dynamic, noindex
    (admin)/admin/   admin dashboard shell (SITEMAP §5)        — dynamic, noindex, 404 gate
    design-system-preview/ living style guide (dev; admin-only in prod)
    (onboarding)/onboarding/ post-signup wizard (minimal static layout, noindex)
    sign-in/ sign-up/ auth-callback/
    api/             me/, auth/sync/, onboarding/, health/, webhooks/ — every server endpoint
    robots.ts sitemap.ts not-found.tsx
  components/
    ui/              shadcn (base-nova, Base UI)
    shared/          PageHeader, EmptyState, StatusBadge, StatCard, PriceTag, RatingStars, BookingTimeline,
                     Stepper, ConfirmDialog, PagePlaceholder… (+ index.ts)
    layout/          AppHeader, AppFooter, MobileMenu, DashboardShell (+ nav, breadcrumb, bottom tabs),
                     AccountControls, ThemeToggle
    onboarding/      wizard, steps, RoleCard, FirstServiceForm, ServicePreviewCard, ImageUploader, SuccessScreen
    service/ provider/ request/ chat/   domain components (ServiceCard, ProviderCard, QuoteCard, ChatBubble…)
    design-system/   style-guide sections
    providers/       query-provider, theme-provider
    forms/           PhoneField, OtpField
    auth/ seo/ marketing/ landing/ motion/ admin/
  hooks/             use-<feature>.ts (TanStack Query over the api-client)
  services/          <feature>.service.ts (business rules, auth guards)
  repositories/      <feature>.repository.ts (only place Prisma is used)
  schemas/           <feature>.schema.ts (Zod, shared by form + API route)
  lib/               db, api-route, api-client, api-guard, errors, r2, query-client, site-url, storefront-cache,
                     zone-guard (layout-level role gate), utils
  utils/             pure helpers (slug, format, zone-access, seo-metadata, structured-data)
  constants/         site, api-routes, query-keys, nav (+ customer-nav, provider-nav, admin-nav), status, upload
  types/             api (envelope), user (DTOs), nav
  config/            env (validated server env)
  data/              static data files
```

Feature docs: `docs/api-conventions.md`, `docs/onboarding-feature.md`.
