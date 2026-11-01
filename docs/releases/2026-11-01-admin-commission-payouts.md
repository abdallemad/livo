# 2026-11-01 — Admin commission settings and payout requests

Details: [admin-commission-payouts-feature.md](../admin-commission-payouts-feature.md).

## `/admin/settings/commission` (AD-06)

- Replaced the placeholder. Edit the **platform rate** with a live preview of what Livo and the provider get
  on a 1,000 EGP booking.
- **Category rates:** every category with its effective rate and where it comes from; set, change or remove a
  category's own rate (sub-categories inherit their parent's).
- **Recent changes** from the audit log (who, when, from → to).
- New endpoints `GET|PATCH /api/admin/commission`, `PUT|DELETE /api/admin/commission/categories/[id]`.
- Rate resolution in `utils/commission.ts` (pure, tested). Changes only affect bookings confirmed afterwards (BR-01).

## `/admin/payouts` (AD-07)

- Replaced the placeholder. Totals, status filter with counts, search, and each provider's **wallet**
  (balance, reserved by other approved payouts, available).
- **Approve** (only if the available balance covers it), **Reject** with a reason, **Mark paid** with an
  optional transfer reference — which writes the `PAYOUT` ledger row. Blocked buttons explain why.
- Each decision is one transaction with a row lock on the provider, a conditional status update, audit and
  a notification to the provider.
- New endpoints `GET /api/admin/payouts`, `PATCH /api/admin/payouts/[id]/status`. Rules in
  `utils/payout-rules.ts` (pure, tested).

## Header

The theme toggle was already removed from the headers in the previous release
([2026-11-01-admin-payments-theme-toggle.md](2026-11-01-admin-payments-theme-toggle.md)); dark mode is in the
avatar menu. No further change.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (81/81; 13 new: 5 commission, 4 payout rules, 4 schema) pass.
- Found and fixed while testing: a blank rate field would have been coerced to **0%**; it is now an error (tested).
- **Not verified in a browser or against a database:** this environment has no `.env` (no DB, no Clerk keys).
  Worth checking with the seed: approving `payout_2_requested` (5,000 EGP, provider 10) should be allowed or
  blocked depending on that provider's ledger balance; marking `payout_3_approved` paid should add a −400 EGP
  `PAYOUT` row.
