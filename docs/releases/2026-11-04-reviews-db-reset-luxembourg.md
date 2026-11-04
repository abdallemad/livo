# 2026-11-04 — Customer reviews, database reset script, English seed for Luxembourg

Details: [customer-review-feature.md](../customer-review-feature.md), [database-reset-seed.md](../database-reset-seed.md).

- **Rate the service** (`/account/bookings/[id]/review`, CU-10) is built — it was a placeholder. Stars + optional public
  comment for finished bookings, once per booking; editable for 7 days until the provider replies; shows the provider's
  reply and "Hidden by Livo". Saving recomputes the provider's rating and BR-04 flag, writes an audit entry, notifies the
  provider live and revalidates the public pages. New `GET` / `PUT /api/me/bookings/[id]/review`.
- The booking page shows **See your review** once rated.
- Rating recompute moved to `services/provider-rating.service.ts`, shared by admin moderation and customer reviews (no
  behaviour change for moderation).
- **`npm run db:reset -- --yes`** (`scripts/db-reset.mjs`): drops every table and enum, re-applies `prisma/sql`, seeds.
  Refuses in production and without `--yes`. `scripts/prebuild-db.cjs` now exports `schemaUrl()` / `applyMigrations()`
  for it (the build behaves the same).
- **Seed rewritten in English, city moved from Cairo to Luxembourg**: Luxembourg (Kirchberg, Belair, Cloche d'Or,
  Limpertsberg, Grund, Bonnevoie, Gasperich, Ville Haute) active, Esch-sur-Alzette inactive. Names, services, requests,
  quotes, chat, reviews, disputes, notifications and ledger notes are English; Arabic kept only in `nameAr`. Two new
  finished, unreviewed bookings (16, 17) to try the review page. Provider hours Mon–Sat 08:00–18:00.
- `LAUNCH_CITY` → "Luxembourg"; the AI assistant no longer says "…, Egypt".

## Verification

- `tsc --noEmit`, `npm run lint`, `npm run build` (against the seeded local DB), `npm test` (221/221; `tests/utils/customer-review.test.ts` new).
- `db:reset` run against a local PostgreSQL 16: wipes real rows, re-applies the 4 migrations, seeds (17 users,
  17 bookings, 10 areas).
- The review service run against that seeded DB: create → provider rating 0/0 → 2.00/1; edit → 4.00/1 and `edited`;
  provider reply → edit refused; unfinished booking → 409; another customer's booking → 404; a 17-day-old review →
  edit refused; 2 `REVIEW_RECEIVED` notifications and `review.create` / `review.update` audit rows.
- **Not clicked through in a browser** (no Clerk keys in the build environment).
- **The project's real database was not reset** from here — run `npm run db:reset -- --yes` with your `.env`.
