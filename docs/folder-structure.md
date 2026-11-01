# Folder structure

The authoritative rules are in `CLAUDE.md` §2–§3; this is the map of what exists today.

```
prisma/              schema.prisma, seed.ts, sql/ (dated idempotent migrations: 2026-11-01-schema-baseline, 2026-11-01-onboarding,
                     2026-11-02-service-moderation)
scripts/             prebuild-db.cjs, build-with-deployment-id.mjs, prepare-standalone.mjs,
                     deployment-id.mjs, warm-cache.mjs, archive/ (one-offs)
tests/               node:test suites — api/, utils/, ui/ (logical-class direction guard), onboarding/, prelaunch/ + alias loader
docs/                SITEMAP.md, DESIGN-SYSTEM.md, srs.md, business-analysis, api-conventions.md, tech-stack.md, onboarding-feature.md, releases/
src/
  proxy.ts           Clerk + CSRF guard + /admin 404 gate + /account & /provider role redirects
                     + ?page=1 redirect + /search noindex header
  app/
    layout.tsx       <html lang="en" dir="ltr">, fonts, ClerkProvider > DirectionProvider > ThemeProvider > QueryProvider
    (marketing)/     header shell, public pages (SITEMAP §2)   — static / ISR / SSG
    (app)/account/   customer sidebar shell (SITEMAP §3)       — dynamic, noindex
    (provider)/provider/ provider sidebar shell (SITEMAP §4)   — dynamic, noindex
    (admin)/admin/   admin dashboard shell (SITEMAP §5)        — dynamic, noindex, 404 gate
    design-system-preview/ living style guide (dev; admin-only in prod)
    (onboarding)/onboarding/ post-signup wizard (minimal static layout, noindex)
    (auth)/          /sign-in, /sign-up, /account-suspended: marketing header + footer around Clerk's embedded forms
    auth-callback/
    api/             me/, auth/sync/, onboarding/, admin/ (dashboard, providers, users, files, disputes, categories, services,
                     requests, bookings, reviews),
                     health/, webhooks/ — every server endpoint
    robots.ts sitemap.ts not-found.tsx
  components/
    ui/              shadcn (base-nova, Base UI)
    shared/          PageHeader, EmptyState, StatusBadge, StatCard, PriceTag, RatingStars, BookingTimeline,
                     Stepper, ConfirmDialog, PagePlaceholder… (+ index.ts)
    layout/          AppHeader, AppFooter, MobileMenu, DashboardShell (+ nav, breadcrumb, bottom tabs),
                     AccountControls (Sign in link / AccountMenu dropdown — dark mode lives here,
                     not as a header button), ThemeToggle (onboarding header + preview only)
    onboarding/      wizard, steps, RoleCard, FirstServiceForm, ServicePreviewCard, SuccessScreen
    service/ provider/ request/ chat/   domain components (ServiceCard, ProviderCard, QuoteCard, ChatBubble…)
    design-system/   style-guide sections
    providers/       query-provider, theme-provider
    forms/           PhoneField, OtpField, FormField, OptionSelect, ImageUploader (shared dropzone: onboarding, services, portfolio)
    admin/           dashboard/ (KPIs, queues), providers/ (list, review, decision actions), users/ (list, detail,
                     status actions), catalog/ (CategoriesTable, CategoryForm, ServicesTable),
                     orders/ (RequestsTable, RequestDetail, BookingsTable, BookingDetail),
                     moderation/ (DisputesTable, DisputeDetail, ResolveDisputeForm, ReviewsTable), shared/ (ReasonDialog, SearchBox, ListPagination, HistoryCard, DetailField)
    auth/ seo/ marketing/ landing/ motion/
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

Feature docs: `docs/api-conventions.md`, `docs/onboarding-feature.md`, `docs/admin-dashboard-feature.md`,
`docs/admin-providers-users-feature.md`, `docs/admin-catalog-feature.md`, `docs/admin-requests-bookings-feature.md`,
`docs/admin-disputes-reviews-feature.md`, `docs/admin-payments-feature.md`,
`docs/admin-commission-payouts-feature.md`, `docs/provider-dashboard-requests-feature.md`,
`docs/provider-quotes-bookings-feature.md`,
`docs/provider-services-portfolio-feature.md`,
`docs/provider-schedule-reviews-feature.md`,
`docs/provider-earnings-payouts-feature.md`,
`docs/provider-verification-settings-feature.md`,
`docs/customer-dashboard-requests-feature.md`,
`docs/customer-account-feature.md`,
`docs/catalog-feature.md`,
`docs/landing-page.md`. Page map: `docs/page-map.md`.
