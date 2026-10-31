# Folder structure

The authoritative rules are in `CLAUDE.md` §2–§3; this is the map of what exists today.

```
prisma/              schema.prisma, seed.ts, sql/ (dated idempotent migrations)
scripts/             prebuild-db.cjs, build-with-deployment-id.mjs, prepare-standalone.mjs,
                     deployment-id.mjs, warm-cache.mjs, archive/ (one-offs)
tests/               node:test suites — api/, utils/, prelaunch/ + alias loader
docs/                srs.md, business-analysis, api-conventions.md, tech-stack.md, releases/
src/
  proxy.ts           Clerk + CSRF guard + /admin 404 gate + ?page=1 redirect
  app/
    layout.tsx       <html lang="ar" dir="rtl">, ClerkProvider > ThemeProvider > QueryProvider
    (marketing)/     header shell, landing page          — static / ISR
    (app)/           customer & provider shell           — static / ISR
    (admin)/admin/   admin dashboard                     — dynamic, noindex
    sign-in/ sign-up/ auth-callback/
    api/             me/, auth/sync/, health/, webhooks/ — every server endpoint
    robots.ts sitemap.ts not-found.tsx
  components/
    ui/              shadcn (base-nova, Base UI)
    shared/          domain-neutral pieces (+ index.ts)
    layout/          AppHeader, AppFooter, AccountControls, ThemeToggle
    providers/       query-provider, theme-provider
    auth/ seo/ forms/ marketing/ landing/ motion/ admin/
  hooks/             use-<feature>.ts (TanStack Query over the api-client)
  services/          <feature>.service.ts (business rules, auth guards)
  repositories/      <feature>.repository.ts (only place Prisma is used)
  schemas/           <feature>.schema.ts (Zod, shared by form + API route)
  lib/               db, api-route, api-client, api-guard, errors, r2, query-client, site-url, storefront-cache, utils
  utils/             pure helpers (slug, format, seo-metadata, structured-data)
  constants/         site, api-routes, query-keys, nav, upload
  types/             api (envelope), user (DTOs)
  config/            env (validated server env)
  data/              static data files
```

Feature docs: `docs/api-conventions.md`.
