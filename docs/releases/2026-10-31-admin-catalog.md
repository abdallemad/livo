# 2026-10-31 — Admin categories & services

Details: [admin-catalog-feature.md](../admin-catalog-feature.md).

- `/admin/categories`: category tree with usage counts, on-site switch, edit, delete only when unused.
- `/admin/categories/new` and `/[id]/edit`: names (EN + AR), URL name (set once), booking type, parent
  (two levels max), order, icon picker, description, show-on-site; unsaved-changes warning; server
  field errors replayed into the form.
- `/admin/services`: every fixed-price service with search, category (incl. sub-categories) and visibility
  filters, the reason a service isn't public, and admin **Hide** (with reason, provider notified) / **Restore**.
- One visibility rule for services: `utils/service-visibility.ts` (unit tested) and the matching Prisma
  filters `SERVICE_VISIBILITY_WHERE` / `VISIBLE_SERVICE` for the future public catalog.

## Schema change

Additive migration `prisma/sql/2026-11-02-service-moderation.sql` (registered in `scripts/prebuild-db.cjs`):
`Service.hiddenByAdminAt TIMESTAMP(3) NULL`, `Service.hiddenByAdminReason TEXT NULL`. Applied to the dev
database with `scripts/prebuild-db.cjs` (idempotent). **Restart `npm run dev`** so the running server loads the
regenerated Prisma client — until then the new admin services page errors on the unknown columns.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (46/46; 5 new visibility tests) pass.
- Services run against the seeded dev DB: tree order and counts; parent options; visibility filters add
  up (11 live + 1 off by provider + 2 provider-inactive = 14 total); category filter includes
  sub-categories. Refusals checked without writing: parent with children → 422, self-parent → 422,
  switch to quotes with live services → 409, delete in use → 409 DEPENDENCY, duplicate slug → 409,
  unknown category → 404, restore a non-hidden service → 409.
- Browser: every new `/api/admin/*` route answers the 404 envelope when signed out.
- **Not verified in a browser:** the admin screens and successful writes (needs an admin sign-in; writes
  would change dev data).
