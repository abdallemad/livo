# Booking a fixed-price service + Stripe Checkout — CU-02, CU-07, BR-01, BR-08

The customer books a catalog service from its page (**Book now** → `/account/book/[serviceId]`) in a short wizard and
pays **online with Stripe Checkout** (hosted page, no card data touches Livo — NF-05) or **in cash after the job**.
Same layering as the rest of the app (CLAUDE.md §2): page → hook → `/api/me/*` → service → repository.

```
wizard ─POST /api/me/bookings─▶ Booking PENDING_PAYMENT + Payment(ONLINE, PENDING) ─▶ Stripe Checkout (hosted)
Stripe ─POST /api/webhook/stripe─▶ Payment PAID, escrow HELD · Booking PENDING_PROVIDER · provider notified
cash:  Booking PENDING_PROVIDER + Payment(CASH, PENDING) at once — the provider collects it after the job
```

From `PENDING_PROVIDER` the existing provider flow takes over (accept → confirmed → start → done, PR-08;
[provider-quotes-bookings-feature.md](provider-quotes-bookings-feature.md)).

## Pages

| Route | What it does |
|---|---|
| `/account/book/[serviceId]` | Wizard: **Date & time** (only days/times that are free) → **Address** (saved addresses in the provider's city) → **Notes** (optional, no contact details — SY-04) → **Payment** (online / cash + summary) → **Book and pay** / **Book now**. Sidebar: the service, price, escrow promise. A service that isn't live is a 404. |
| `/account/book/[serviceId]?booking=<id>&checkout=success\|cancelled` | **Confirmation** step for that booking (owner only). After Stripe's redirect it polls every 3 s (max 20 times) until the payment settles; a cancelled or expired checkout keeps the booking unpaid with **Try paying again**. |
| `/account/bookings` | **Pay now** on an unpaid booking now opens Stripe Checkout directly (it used to link to the placeholder detail page). |

## Rules — `src/utils/booking-checkout.ts` (pure, tested)

- **Time:** a Cairo-time day + a start on the 30-minute grid → one UTC instant (`slotInstant`, DST-safe round trip).
  At least **2 hours** ahead, at most **30 days**.
- **Working hours:** inside the provider's weekly hours (`/provider/schedule`); a provider with no hours set is bookable
  08:00–20:00 every day.
- **No double booking:** a start may not overlap another of the provider's bookings that blocks the calendar
  (`PENDING_PROVIDER`, `CONFIRMED`, `IN_PROGRESS`, `AWAITING_CONFIRMATION`). Each booking counts as
  `max(service duration, 60 min)`. Checked when the wizard loads (only free times are offered), on submit, and again
  inside the create transaction. An unpaid checkout doesn't hold the slot.
- **Address:** one of the customer's saved addresses, in the provider's city. A frozen copy goes on the booking
  (`addressSnapshot` — label, city, area, street, details); the provider sees the street only after accepting (BR-02).
- **Money snapshot (BR-01):** amount = the service price; commission rate resolved now with the same rule as the admin
  commission page (category → parent → global, `utils/commission.ts`) and frozen with the commission and provider net.
- **Number:** `LV-<year>-<6 digits>`, the year's highest + 1 (retried on a unique clash), same format as the seed.
- You can't book your own service. Suspended accounts are stopped by `requireUser()` as everywhere else.

## Stripe Checkout

- `src/lib/stripe.ts`: one lazy client, **API version pinned** (`2026-10-28.endive`, matching the installed `stripe`
  package) — bump both together on purpose. Without `STRIPE_SECRET` the wizard offers **cash only** and checkout calls answer 503.
- Session: `mode: payment`, currency **EGP**, one inline `price_data` line (every booking has its own frozen amount, so
  there's no reusable Stripe Price to cache — CLAUDE.md §8's price caching applies to catalog products, not to this),
  amount in piastres, `metadata` + `payment_intent_data.metadata` = `{ kind: "booking", bookingId, paymentId, bookingNumber }`,
  `customer_email` from the account, expires after **1 hour**, idempotency key per payment row (a double submit returns the
  same session). `Payment.gatewayRef` = the session id.
- If Stripe can't open a session while booking, the new booking is cancelled and its payment failed (so a retry doesn't
  leave duplicates) and the customer gets a 503 asking to retry or choose cash.
- **Pay again** (`POST /api/me/bookings/[id]/checkout`): reuses the open session; if it expired or was abandoned, that
  payment row becomes `FAILED` and a new payment row + session is created. A session that turns out to be paid is applied
  instead (409 "already paid").

## Webhook — `POST /api/webhook/stripe`

The path the Stripe dashboard is configured with. **The webhook is the fact; the redirect is a convenience** (CLAUDE.md §8).

- No session. Verified with `stripe.webhooks.constructEventAsync(rawBody, Stripe-Signature, STRIPE_WEBHOOK_SECRET)` over
  `request.text()`. CSRF-exempt: `lib/api-guard.ts` now exempts `/api/webhook/` as well as `/api/webhooks/`.
- Answers **400** for a missing / wrong signature, **500** if handling throws (Stripe retries), **200** otherwise
  (including event types we ignore).
- Events to subscribe the endpoint to:

| Event | Effect |
|---|---|
| `checkout.session.completed` (payment_status `paid`) | `markCheckoutPaid` |
| `checkout.session.async_payment_succeeded` | `markCheckoutPaid` |
| `checkout.session.async_payment_failed`, `checkout.session.expired` | payment → `FAILED`; booking stays `PENDING_PAYMENT` so the customer can pay again |

`markCheckoutPaid` (the one function that turns money into "paid"):
1. Finds the payment by `gatewayRef = session.id`, and **refuses** (logs, leaves it pending) if the metadata ids, currency
   or `amount_total` don't match our row.
2. One transaction: payment `PENDING/FAILED → PAID`, escrow `HELD`, `paidAt`, verified summary in `gatewayPayload`
   (session, payment intent, amount, event id) — conditional, so a repeated delivery is a no-op;
   booking `PENDING_PAYMENT → PENDING_PROVIDER`; audit `payment.paid`; notifications: customer `PAYMENT_UPDATE`,
   provider `BOOKING_CREATED`.
3. If the booking was no longer waiting (e.g. an admin cancelled it during checkout), the money stays `HELD`, every admin
   gets a "needs a refund" notification and the audit log gets `payment.paid_after_close`.

**Reconcile:** the confirmation endpoint asks Stripe for the session once per poll while the booking is unpaid, and applies
the same `markCheckoutPaid` (data comes from Stripe with the secret key, never from the browser). This covers a redirect that
beats the webhook, and local development without `stripe listen`.

## API

| Method | Path | Does |
|---|---|---|
| POST | `/api/me/bookings` | `{ serviceId, date, time, addressId, notes?, paymentMethod: "ONLINE"\|"CASH" }` → 201 `CreatedBookingDto` (`checkoutUrl` for online) |
| POST | `/api/me/bookings/[id]/checkout` | `CheckoutSessionDto` for the customer's own `PENDING_PAYMENT` booking (409 otherwise) |
| GET | `/api/me/bookings/[id]/confirmation` | `BookingConfirmationDto` (owner only, `private, no-store`) |
| POST | `/api/webhook/stripe` | Stripe events (signature-authenticated) |

The `/api/me/*` routes call `requireUser()`; the customer id is always the session's. Bookings aren't on public pages, so
nothing here revalidates the storefront.

## Setup

1. `.env`: `STRIPE_SECRET=sk_test_…` and `STRIPE_WEBHOOK_SECRET=whsec_…` (placeholders in `.env.example`; never commit
   real keys). `NEXT_PUBLIC_SERVER_URL` must be the public origin: Stripe's success / cancel URLs are built from it.
2. Stripe dashboard → Developers → Webhooks → endpoint `https://<your-domain>/api/webhook/stripe` with the four events above.
3. Local: `stripe listen --forward-to localhost:3000/api/webhook/stripe` and use the `whsec_…` it prints.
4. `npm run check-env` now fails if `STRIPE_SECRET` is set without `STRIPE_WEBHOOK_SECRET`, or a production build uses `sk_test_`.
5. EGP must be enabled for card payments on the Stripe account.

## Files

| Layer | File |
|---|---|
| Util + tests | `src/utils/booking-checkout.ts`, `tests/utils/booking-checkout.test.ts` (slots, hours, overlap, window, numbering, piastres, schema) |
| Schema | `src/schemas/booking.schema.ts` (`createServiceBookingSchema`, shared by the wizard and the route) |
| DTOs | `src/types/booking.ts` |
| Infra | `src/lib/stripe.ts`, `src/config/env.ts` (`STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `getStripeEnv`), `src/lib/api-guard.ts` (exemption) |
| Repository | `src/repositories/booking-checkout.repository.ts` |
| Service | `src/services/booking-checkout.service.ts` |
| Routes | `src/app/api/me/bookings/route.ts` (`POST` added), `…/[id]/checkout/route.ts`, `…/[id]/confirmation/route.ts`, `src/app/api/webhook/stripe/route.ts` |
| Constants | `API_ROUTES.customer.bookingCheckout / bookingConfirmation`, `API_ROUTES.stripeWebhook`, `customerKeys.bookingConfirmation`, audit labels `booking.create`, `payment.paid`, `payment.paid_after_close` |
| Hook | `src/hooks/use-booking.ts` |
| UI | `src/components/booking/{BookServiceWizard,BookingConfirmation,PayNowButton}.tsx`; `MyBookingsList` uses `PayNowButton` |
| Page | `src/app/(app)/account/book/[serviceId]/page.tsx` |

New dependency: `stripe`. No schema change and no migration (Booking, Payment, Notification, AuditLog already had every column).

## Not done / follow-ups

- **Refunds through Stripe.** A provider decline, an admin cancellation or a dispute still records the refund on the
  payment row only (as before); calling `stripe.refunds.create` with the stored payment intent is the next step.
  Same for **payouts** to providers.
- Expiring the Stripe session when an admin cancels an unpaid booking (today a late payment is caught and flagged for refund).
- Slot locking is check-then-insert; two simultaneous bookings for the same minute could both pass. The provider can decline the clash.
- Booking detail page `/account/bookings/[id]` is built ([customer-booking-detail-feature.md](customer-booking-detail-feature.md)); a customer cancel before acceptance is refunded on Stripe automatically.
- Quote bookings (accepting a quote) don't create bookings yet; when they do, they can reuse `startCheckout` unchanged.
