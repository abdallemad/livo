# 2026-11-01 — Admin payments page, theme toggle moved into the account menu

## `/admin/payments` (AD-07)

Details: [admin-payments-feature.md](../admin-payments-feature.md).

- Replaced the placeholder with a working page: totals cards (collected online, held in escrow, released to
  providers + refunded, cash jobs + pending / failed), and a paginated table of every payment with its
  booking, parties, amount, refunds, commission %, method, escrow state, gateway ref, dates, status and a
  link to any open dispute.
- Filters in the URL: status (with counts), method, escrow state, search.
- New endpoint `GET /api/admin/payments` (admin only). Read-only: no money moves from this page.
- Totals come from `utils/payment-summary.ts` (pure, 5 new tests), consistent with the dispute money rule.

## Theme toggle

- The sun/moon **theme toggle button was removed from the headers**: the public header (`AppHeader`) and
  the dashboard top bar (`DashboardShell`, used by `/account`, `/provider` and `/admin`).
- Dark mode is switched from the **account dropdown** (avatar → "Dark mode"), which already existed in
  `AccountMenu`.
- Consequence: signed-out visitors no longer have a theme switch; they get the default theme (or the one
  they set before). `ThemeToggle` itself still exists and is still used by the onboarding header (which
  has no account menu) and the internal design-system preview.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (68/68; 5 new) pass.
- **Not verified in a browser or against a database:** this environment has no `.env` (no DB, no Clerk
  keys), so the page and the API were type-checked and unit-tested but not run.
