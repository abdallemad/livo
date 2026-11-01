# 2026-11-01 — Customer home and requests

Details: [customer-dashboard-requests-feature.md](../customer-dashboard-requests-feature.md).

## `/account` (CU-08)

- Replaced the static zeros: upcoming bookings, open requests, quotes waiting, jobs to review; a **Needs your
  attention** list (confirm a finished job before its deadline, finish a payment, compare quotes, leave a review);
  the 5 soonest bookings (Cairo time) and 5 newest open requests. New `GET /api/me/dashboard`.

## `/account/requests` (CU-13, CU-11)

- Replaced the placeholder: Active / Booked / Closed tabs with counts, search, cards with the customer-facing state
  ("Quotes received"), quote count and lowest price, budget, dates, the booking once a quote is accepted, and
  **Cancel request** for drafts and open requests (waiting quotes expire, providers are told).
  New `GET /api/me/requests`, `PATCH /api/me/requests/[id]/status`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (131/131; 3 new) pass.
- **Not verified in a browser or against a database:** this environment has no `.env`. Worth checking with the seed:
  customer 1 should see request 1 («دهان شقة 3 أوض وصالة», painting a 3-room flat) under Active as **Quotes received** with 2 quotes from
  12,800 EGP, and it in "Needs your attention"; cancelling it should expire both quotes.
