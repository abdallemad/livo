# Resetting and seeding the database

Two scripts, both reading `DATABASE_URL` / `DIRECT_URL` from `.env` / `.env.local`:

| Command | What it does | Touches real rows? |
|---|---|---|
| `npm run db:seed` | Upserts reference data, then deletes and recreates every `seed_` row | No — only `seed_…` ids |
| `npm run db:seed -- --reset` | Deletes every `seed_` row; reference data stays | No |
| `npm run db:reset -- --yes` | **Drops every table and enum**, re-applies `prisma/sql` in order, then seeds | **Yes — everything** |
| `npm run db:reset -- --yes --no-seed` | Same, but leaves the database empty | **Yes** |
| `npm run db:seed:images` | Gives services a random stock cover (`Service.imageUrl`; Picsum, or Unsplash with `UNSPLASH_ACCESS_KEY`) — docs/service-images-feature.md | Only `Service.imageUrl` |

## `npm run db:reset` — `scripts/db-reset.mjs`

1. Refuses with `NODE_ENV=production`, and without `--yes` (it prints which host/database it would wipe, never the
   password).
2. Picks the URL with the build's own rules (`schemaUrl()` exported from `scripts/prebuild-db.cjs`): `DIRECT_URL` only
   when it points at the same database as `DATABASE_URL`; a transaction-pooler port (6543) is swapped for the session
   port, because DDL through the pooler is unreliable.
3. Drops every table and enum in `public` one by one (not `DROP SCHEMA`), so the schema keeps the owner and grants the
   host gave it (Neon, Supabase…).
4. Applies every migration in `migrationFiles` (`applyMigrations()`, the same runner `npm run build` uses).
5. Runs `prisma/seed.ts`.

**After a reset**, everyone who already had an account (Clerk) gets a fresh `User` row on their next visit through
`/auth-callback`, but their role, onboarding, addresses, bookings… are gone: they go through onboarding again. An admin
must be made admin again by hand (`User.role = 'ADMIN'`).

## What the seed contains — `prisma/seed.ts`

All text is **English**. Arabic stays only in the `nameAr` columns of cities, areas and categories, which exist for an
Arabic version of the site; the English UI shows `nameEn`.

**Reference data** (upserted with `update: {}`, so a re-run never overwrites an admin's edits):

| What | Values |
|---|---|
| Cities | **Luxembourg** (active), Esch-sur-Alzette (inactive — adding a city is data, NF-09) |
| Areas — Luxembourg | Kirchberg, Belair, Cloche d'Or, Limpertsberg, Grund, Bonnevoie, Gasperich, Ville Haute |
| Areas — Esch-sur-Alzette | Esch Centre, Belval |
| Categories | Plumbing (Leak repair, Water heaters), Electrical (Wiring), Cleaning, Finishing (Painting, Tiling), Air conditioning |
| Commission | 10 % global, 12 % cleaning |
| Site settings | request expiry 7 days, objection window 48 h, BR-04 threshold 5 reviews / ≤ 3 average, cancellation policy, contact blocking |
| Static pages | about, terms, privacy, faq |

**Mock data** (`seed_` ids): 1 admin, 6 customers (one suspended), 10 providers covering every verification status,
13 services (one inactive, one from a suspended provider), 9 requests and 9 quotes in every status, **17 bookings** in
every booking status (incl. milestones, a dispute under review, a resolved one and an open one), payments in every
escrow state, chat, reviews both ways (one hidden), invoices, payouts, wallet ledger, notifications, audit log.
Providers work Monday–Saturday 08:00–18:00.

Bookings **16** (completed, online) and **17** (closed, cash) are finished but have **no customer review**, so the review
page ([customer-review-feature.md](customer-review-feature.md)) has something to rate. Booking 6's review is recent enough
to still be editable; older ones show why they can't change.

Mock users are not Clerk users: nobody can sign in as them. Their phones are in the `+20 100 000 00xx` test range; the
seed refuses `NODE_ENV=production`.

## Changing the launch city

The city shown in the UI ("Now live in Luxembourg", the hero's "All of Luxembourg") is `LAUNCH_CITY` in
`src/constants/site.ts`; the areas in every picker come from the database. To launch somewhere else, change both the
seed's `CITIES` / `AREAS` and `LAUNCH_CITY`, then reset or seed.

Still Egypt-specific (not changed with the move to Luxembourg — decide before launch):

- Time zone `Africa/Cairo` (`APP_TIME_ZONE` in `src/utils/zoned-time.ts`) and the "Cairo time" labels on schedule,
  booking and dashboard screens.
- Currency **USD** (`utils/format.ts`, the AI assistant's prompt).
- Phone validation and formatting (Egyptian mobiles), payout destinations (Egyptian wallets / IBAN), the Saturday-first
  week on the schedule editor.
