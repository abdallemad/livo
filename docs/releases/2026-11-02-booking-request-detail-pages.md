# 2026-11-02 — Booking details, customer request details, provider request details

Details: [customer-booking-detail-feature.md](../customer-booking-detail-feature.md),
[customer-request-detail-feature.md](../customer-request-detail-feature.md),
[provider-request-detail-feature.md](../provider-request-detail-feature.md).

- **`/account/bookings/[id]`** (CU-09, CU-11, CU-12): progress, next step, provider (phone + chat once accepted), payment
  (held / refunded), history. **Confirm the job is done** releases held online money to the provider's wallet (EARNING) or,
  for cash, marks it paid and charges the commission (COMMISSION_DEBT). **Cancel** only before the provider accepts —
  held money is refunded in full **on Stripe**, an open checkout is expired, admins are told if a refund can't be sent.
  Later cancellation waits for the BR-06 policy.
- **`/account/requests/[id]`** (CU-04, CU-05, CU-08): progress timeline, the request and photos, quotes to **compare**
  (price, duration, rating, jobs done, experience; sort by price / rating / newest; contact details masked) and **accept**
  — online (Stripe Checkout, back to the booking page, which waits for the payment) or cash. Accepting creates a `QUOTE`
  booking and declines the other quotes; cancelling that booking closes the request.
- **`/provider/requests/[id]`** (PR-07): the job (area only, masked description, photos), budget, date, quotes so far;
  **send**, **change**, **withdraw** and **send again** a quote (price, days, message, valid 3–30 days). The customer is notified.
- New endpoints: `GET /api/me/bookings/[id]`, `PATCH /api/me/bookings/[id]/status`, `GET /api/me/requests/[id]`,
  `POST /api/me/requests/[id]/booking`, `GET /api/provider/requests/[id]`, `PUT /api/provider/requests/[id]/quote`,
  `GET /api/provider/requests/[id]/photos/[fileId]`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `npm run lint`, `npm test` (197/197; 18 new across `customer-booking-actions`, `customer-request-detail`,
  `provider-quote-send`) pass.
- **Not verified against a database, Stripe or in a browser** (no `.env` here). Worth checking with the seed: a provider
  sends a quote on an open request → the customer sees it on `/account/requests/[id]`, accepts with cash → the booking
  appears in the provider's bookings; the provider accepts, starts, marks done → the customer confirms on
  `/account/bookings/[id]` and the provider's wallet shows the commission debt. Repeat online with card `4242 4242 4242 4242`
  and `stripe listen`; cancel a paid booking before acceptance and check the refund in the Stripe dashboard.
