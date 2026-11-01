# 2026-11-01 — Provider earnings and payouts

Details: [provider-earnings-payouts-feature.md](../provider-earnings-payouts-feature.md).

## `/provider/earnings` (PR-11)

- Replaced the placeholder: wallet summary — available to withdraw, on hold in escrow, received (payouts + cash
  collected), commission deducted — this month vs last, a warning when cash-job commission makes the balance
  negative, and every wallet movement with the balance after it (type filter, paging).
- New `GET /api/provider/earnings`.

## `/provider/payouts` (PR-12)

- Replaced the placeholder: request a payout (amount, mobile wallet / InstaPay or bank account, prefilled from the
  last request) or a clear reason why not now; history with status, dates and the admin's reason when declined.
- Rules: approved account, one waiting request at a time, at least 100 EGP, at most what's available (balance minus
  every open request). Checked under the same provider lock the admin uses; admins get an in-app notification.
- New `GET|POST /api/provider/payouts`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (125/125; 6 new) pass.
- Found and fixed while testing: InstaPay addresses with a dot (`ahmed.s@instapay`) were mangled by the phone-number
  clean-up; they're now checked first. I also removed a "paid within 2 working days" promise from the form — no doc
  defines a payout time.
- **Not verified in a browser or against a database:** this environment has no `.env`. Worth checking with the seed:
  provider 10 already has a 5,000 EGP request waiting, so the form should be replaced by "You already have a payout
  request waiting"; provider 4's ledger should show the 150 EGP adjustment with a running balance.
