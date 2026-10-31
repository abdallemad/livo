# 2026-10-31 — Violet brand colour, account menu, sign-in pages, live admin dashboard

## 1. Primary colour → violet

`src/app/globals.css` (the only place colours live):

| Token | Light | Dark |
|---|---|---|
| `primary`, `ring`, `chart-1`, `sidebar-primary`, `sidebar-ring` | `#6B2FC4` (was `#0F5C5A`) | `#B37AFD` (was `#3FB8B0`) |
| `primary-foreground`, `sidebar-primary-foreground` | `#FFFFFF` (unchanged) | `#1C0A3A` (was `#08201F`) |

`#B37AFD` is the brand colour as given. On light surfaces it only reaches ~2.9:1 against white text (below AA),
so light mode uses a darker shade of the same violet: white on `#6B2FC4` = 7.4:1, `#6B2FC4` on the page
background = 6.8:1. Dark mode: `#1C0A3A` on `#B37AFD` = 6.2:1. All pass WCAG AA.
Neutral surfaces (`accent`, `secondary`, borders) and the amber `commit` colour are unchanged.
`docs/DESIGN-SYSTEM.md` §2 tables updated.

## 2. Account menu instead of Clerk's `<UserButton>`

- `src/components/layout/AccountMenu.tsx` (new): avatar button → dropdown with the user's name/email,
  **one** dashboard link chosen by role (`ADMIN` → `/admin`, `PROVIDER` → `/provider`,
  `CUSTOMER` → `/account`; unfinished onboarding → `/onboarding`), a **Dark mode** checkbox and
  **Sign out** (clears the TanStack cache, then Clerk `signOut` → `/`).
- `AccountControls.tsx`: the separate dashboard icon button is gone (it's in the menu now). Still a
  client island with a same-size placeholder, so layouts stay static.

## 3. Sign in / sign up are pages, not a modal

- Header "Sign in" is now a plain link to `/sign-in` (no `<SignInButton mode="modal">`).
- `src/app/sign-in` and `src/app/sign-up` moved into a new `src/app/(auth)/` route group whose
  layout renders `AppHeader` + `AppFooter`. URLs are unchanged. Clerk's own "Sign up" / "Sign in"
  links switch between the two pages.

## 4. Admin dashboard is live

`/admin` now reads real data and its actions work — see [admin-dashboard-feature.md](../admin-dashboard-feature.md).
New endpoints: `GET /api/admin/dashboard`, `PATCH /api/admin/providers/[id]/status`,
`PATCH /api/admin/disputes/[id]/status`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src`, `npm test` (40/40) pass.
- Browser (dev server): violet primary in light and dark; header "Sign in" → `/sign-in` with header +
  footer; "Sign up" link → `/sign-up`; `GET /api/admin/dashboard` signed-out → 404 envelope.
- `getAdminDashboard()` run against the seeded dev DB returns real KPIs, 2 pending providers,
  2 open disputes and the latest bookings. The error paths of both actions (unknown id → 404,
  already decided → 409, short/missing reason → rejected by the schema) were run against the DB;
  they write nothing.
- **Not verified in a browser:** the signed-in account menu and the admin page UI, and the
  successful approve/reject/start-review writes (they would change the dev data). Sign in as an
  admin to check them.
