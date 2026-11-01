# 2026-11-01 — Customer bookings, payments, addresses and settings

Details: [customer-account-feature.md](../customer-account-feature.md).

- **`/account/bookings`** (CU-13): Current / Finished / Cancelled with counts and search; each booking with its next step in
  plain words, the provider's phone once confirmed (BR-02), a review link for finished jobs, and Pay now / Confirm the job.
- **`/account/payments`** (CU-13, SY-07): paid / held safely by Livo / refunded totals; payment history with escrow explained;
  invoices (PDF generation is still to come).
- **`/account/addresses`** (CU-14): add, edit, delete, one default (promoted automatically when the default is deleted), up to 10.
- **`/account/settings`** (AU-06): personal details, interests, account actions; deletion via support for now (AU-07).
- New endpoints under `/api/me/{bookings,payments,addresses,settings}`.
- The personal-details card and account card were moved out of the provider settings form into `components/account/` and are
  shared by both zones, with one server function (`savePersonalDetails`).

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (136/136; 5 new) pass.
- **Not verified in a browser or against a database:** this environment has no `.env`. Worth checking with the seed: customer 1's
  default address shows as Default; adding a second and deleting the first makes the second the default; a finished booking
  without a review shows "Leave a review".
