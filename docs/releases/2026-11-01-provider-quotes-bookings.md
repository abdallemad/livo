# 2026-11-01 — Provider quotes and bookings

Details: [provider-quotes-bookings-feature.md](../provider-quotes-bookings-feature.md).

## `/provider/quotes` (PR-07)

- Replaced the placeholder: every quote sent, status tabs with counts, search; your price, duration, the
  customer's budget and how many quotes the request has; an accepted quote links to its booking.
- **Withdraw** a waiting quote on an open request (`PATCH /api/provider/quotes/[id]/status`).

## `/provider/bookings` and `/provider/bookings/[id]` (PR-08)

- Replaced both placeholders. Tabs Current / Finished / Cancelled; cards with Cairo-time appointment, place,
  what the provider gets and how they're paid.
- **Accept** (unlocks the customer's name, phone and address — BR-02), **Decline** with a reason (refunds money
  still held, fails unpaid checkouts), **Start work**, **Mark the job as done** (starts the BR-08 objection
  window from `SiteSetting`). Each is one transaction with audit and a customer notification.
- Detail page: next step, when and where, customer (locked until accepted, notes with contact details masked —
  SY-04), money (commission at the booking's frozen rate), timeline.
- New endpoints: `GET /api/provider/quotes`, `PATCH /api/provider/quotes/[id]/status`, `GET /api/provider/bookings`,
  `GET /api/provider/bookings/[id]`, `PATCH /api/provider/bookings/[id]/status`.

## Also changed

- `bookingPlace()` / `firstName()` moved from `provider-dashboard.service.ts` to `utils/provider-booking.ts` (shared,
  tested); the home page now uses the shared Cairo formatters from `utils/zoned-time.ts`.
- New audit labels for the four provider booking actions.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (106/106; 14 new) pass.
- Found and fixed while testing: a declined cash booking would still have said "collect cash from the customer".
- **Not verified in a browser or against a database:** this environment has no `.env` (no DB, no Clerk keys).
  Worth checking with the seed: a provider with a `PENDING_PROVIDER` booking should see Accept / Decline; accepting
  should reveal the customer's phone and address; declining an online-paid booking should leave its payment `REFUNDED`.
