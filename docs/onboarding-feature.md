# Onboarding

Status: **built**. Post-signup wizard at `/onboarding` (AU-03, PR-01, PR-02, PR-03, PR-05, Flow 3).

## Flow

`/auth-callback` → `POST /api/auth/sync` → `homeFor(viewer)`: unfinished users go to `/onboarding`,
finished ones to their dashboard. The proxy keeps it that way: `/account*` and `/provider*` send unfinished
users back to the wizard, `/onboarding` sends finished users to their dashboard. Public pages stay open,
so nobody is trapped.

| # | Customer | Provider |
|---|---|---|
| 1 | Role (`I want to hire` / `I offer services`) | same |
| 2 | Name, email (opt.), photo (opt., stored in Clerk), city, area (opt.) | same, area **required** = first coverage area (creates the DRAFT `ProviderProfile`) |
| 3 | Default address (optional, skippable) | Bio, years, categories, coverage areas |
| 4 | Interests (optional) → **finish**: `CustomerProfile` + `onboardingCompletedAt` | Documents: national ID + selfie (required), up to 3 certificates |
| 5 | | First fixed-price service with live preview (skipped automatically for quote-only trades) |
| 6 | | Review + terms → **submit**: DRAFT → `PENDING`, `onboardingCompletedAt`, admin notifications, audit entry |

Providers can "save and exit" on every step; the wizard resumes where the DB says they are.

## Where things live

| Layer | Files |
|---|---|
| Constants | `src/constants/onboarding.ts` (limits, step lists, terms version) |
| Pure rules | `src/utils/onboarding-state.ts` (step derivation, edit guards, `homeFor`), `src/utils/zone-access.ts` (redirects), `src/utils/file-signature.ts` (magic bytes) |
| Schemas | `src/schemas/onboarding.schema.ts` (one Zod schema per step, English messages) |
| Repository | `src/repositories/onboarding.repository.ts` |
| Service | `src/services/onboarding.service.ts` |
| API routes | `src/app/api/onboarding/**` (table below) |
| Types | `src/types/onboarding.ts` (DTOs) |
| Hooks | `src/hooks/use-onboarding.ts`, `use-unsaved-changes.ts`, `use-focus-on-mount.ts` |
| UI | `src/components/onboarding/**` (wizard, progress, steps, `RoleCard`, `FirstServiceForm`, `ServicePreviewCard`, `ImageUploader`, `SuccessScreen`) |
| Route | `src/app/(onboarding)/onboarding/` (minimal static layout, `noindex`) |

| Method + path | Does |
|---|---|
| `GET /api/onboarding` | State, prefill data and options (cities/areas/categories), derived from the DB |
| `PUT /api/onboarding/role` | Step 1 |
| `PUT /api/onboarding/basic-info` | Step 2 |
| `PUT /api/onboarding/address` | Customer step 3 |
| `POST /api/onboarding/complete` | Customer finish (interests may be empty) |
| `PUT /api/onboarding/provider-profile` | Provider step 3 |
| `POST /api/onboarding/documents`, `DELETE …/documents/[id]` | Provider step 4 (multipart `type` + `file`) |
| `POST /api/onboarding/service/images`, `DELETE …/service/images/[id]` | Service images (attached when the service is saved) |
| `PUT /api/onboarding/service` | Provider step 5 (create or update the first service) |
| `POST /api/onboarding/submit` | Provider step 6 (`{ acceptTerms: true }`) |
| `GET /api/onboarding/files/[id]` | **Owner-only** 307 to a 5-minute signed inline URL |

## Rules (enforced in the service, never by the client)

- Every route: `requireUser()` → Zod → service. The user id comes from the session only. No schema has a
  `userId`, `ADMIN`, `verificationStatus` or `status` field.
- The current step is derived from the DB on every request (`deriveOnboardingState`). A save is rejected
  when onboarding is completed (409), the step belongs to the other role (403), or a required earlier step
  isn't done (409).
- Role can change until completion; switching away from PROVIDER keeps the DRAFT profile (nothing of it is public).
- Finish/submit are conditional updates (`WHERE onboardingCompletedAt IS NULL`, `WHERE verificationStatus =
  'DRAFT'`), so a double click or two tabs can't complete twice or write two audit entries.
- City, areas and categories must be active; areas must be inside the user's city; the service category must be
  one of the provider's own categories and allow fixed prices.
- Quote-only providers (all categories `QUOTE`, e.g. finishing) can't hold a fixed-price service, so step 5 counts
  as done for them instead of trapping them.
- Names reject digits of any numbering system (Arabic-Indic too), so a phone number can't hide in a name (SY-04).
- Prices: `SERVICE_PRICE_MIN`..`SERVICE_PRICE_MAX` EGP, max 2 decimals, stored as `Decimal`.
- The name is mirrored to Clerk (UI reads identity from Clerk); the profile photo is uploaded straight to Clerk
  and its URL copied into `User.avatarUrl`. Both best effort: a Clerk hiccup doesn't lose the step.

## Files and privacy

- Documents: `private/verification/<userId>/<uuid>.<ext>`; service images: `uploads/services/<userId>/<uuid>.<ext>`.
  Private bucket for both. No public route serves either prefix.
- Validated by magic bytes (`detectFileType`) and size (`constants/upload.ts`); the browser's mime claim and
  file name are ignored. Images are compressed in the browser first (`lib/image-compress.ts`).
- The only way to view one is `GET /api/onboarding/files/[id]`, which checks the uploader is the caller and the
  key is under their own prefix, then answers a 5-minute signed link (`no-store`). Admin review gets its own
  route in the admin feature.
- No other user's phone or email is in any onboarding response.

## On submit

One transaction: DRAFT → PENDING, `onboardingCompletedAt`, an in-app `Notification` to every active admin plus
one to the provider, and an `AuditLog` row `provider.submit_for_review` (metadata: terms version + acceptance
time — terms acceptance lives there, not in a column). Then `sendOpsAlert()` (`src/lib/ops-alerts.ts`): the
SMS/WhatsApp hook point, a logged no-op until a messaging provider is wired. No `revalidateStorefront()`:
nothing is public until an admin approves.

## Open items

- Provider "primary area" isn't modelled; it's the area picked in step 2 and kept as a coverage area.
- Approved/rejected handling (`/provider/verification`, admin review queue) is the admin feature's job. The
  `/provider/onboarding` placeholder in SITEMAP overlaps this wizard and can be retired.
- Email is stored in our DB only (not added to Clerk, which would need verification).

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
