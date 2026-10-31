# Onboarding

Status: **groundwork only** (schema, migrations, seed). No UI, API routes or services yet.

## Decisions

These are settled. Don't revisit them while building the feature.

1. **No Server Actions.** Every client↔server call is a Route Handler under `src/app/api/`
   (CLAUDE.md §2). Onboarding endpoints live under `/api/onboarding/*`.
2. **Document uploads go through an authenticated upload route**: `multipart/form-data` → magic-byte
   + size check → private R2 bucket. The browser never gets a presigned PUT. Admins view documents
   only through a **5-minute presigned GET**.
3. **Schema additions** (below), all optional/additive.
4. **Migrations are additive, idempotent SQL files** in `prisma/sql/`, registered in
   `scripts/prebuild-db.cjs` (`migrationFiles`) and applied before `next build`.

### Schema additions

| Field / model | Why |
|---|---|
| `User.onboardingCompletedAt DateTime?` | The single "finished onboarding" flag, read by the proxy and `/auth-callback`. It can't be derived, because a customer has no required rows. |
| `User.roleSelectedAt DateTime?` | `role` defaults to `CUSTOMER`, so without this "picked customer" and "hasn't picked yet" look the same. |
| `User.cityId String?` → `City` (`onDelete: SetNull`, indexed) | Step 2 asks every user for a city; a customer who skips the address step has nowhere else to keep it. |
| `CustomerInterest (userId, categoryId)` | The optional "interests" step. Composite PK, cascades from both `User` and `Category`. |

The seed marks every mock user as onboarded and in Cairo, except provider 9 (`DRAFT`), who picked a
role but never finished. That's the wizard's resume case. Customers 1–3 have a few interests.

### Migration baseline

`2026-10-31-init.sql` created the *old* `User`/`File` tables (`imageUrl`, `size`, no `name`/`status`) and
no longer matched the schema. It had never been applied to a database holding real data (pre-launch),
so it was **deleted** and replaced by `2026-11-01-schema-baseline.sql`: the output of
`prisma migrate diff --from-empty`, rewritten to be idempotent, plus the `Review.rating` 1–5 `CHECK`.
Current order in `migrationFiles`:

1. `2026-11-01-schema-baseline.sql`
2. `2026-11-01-onboarding.sql`

From now on the rule in `prebuild-db.cjs` holds: append new files, never edit or remove applied ones.
To check for drift:
`npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script`
must print an empty migration.
