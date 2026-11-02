# 2026-11-02 — Book a service with Stripe Checkout; admins can make other admins

Details: [booking-checkout-feature.md](../booking-checkout-feature.md), [admin-providers-users-feature.md](../admin-providers-users-feature.md#make-admin).

- **`/account/book/[serviceId]`** (CU-02, CU-07) is built: date & time (only the provider's free times inside their
  working hours, 2 h – 30 days ahead) → saved address in the provider's city → notes (no contact details) → **pay online
  with Stripe Checkout** or **cash after the job** → confirmation. The money snapshot (price, commission rate resolved like
  the admin commission page, provider net) is frozen on the booking (BR-01).
- **Stripe:** `POST /api/me/bookings` creates the booking and a hosted Checkout session (EGP); `POST /api/webhook/stripe`
  (signature-verified, idempotent) marks the payment **PAID / escrow HELD** and sends the booking to the provider
  (`PENDING_PROVIDER`). Expired / failed checkouts keep the booking unpaid so the customer can **Pay again**
  (`POST /api/me/bookings/[id]/checkout`). The confirmation step polls `GET /api/me/bookings/[id]/confirmation`, which also
  reconciles with Stripe if the redirect beats the webhook.
- **My bookings → Pay now** opens Stripe Checkout directly.
- **Admin → Users → Make admin** (`PATCH /api/admin/users/[id]/role`): promote an active customer or provider to admin.
  Upgrade only, confirmed, audited (`user.make_admin`), the person is notified.
- New env: `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` (`.env.example`; `check-env` warns on a missing webhook secret or a
  test key in production). New dependency: `stripe`. CSRF guard now also exempts `/api/webhook/`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `npm run lint`, `npm test` (179/179; new `tests/utils/booking-checkout.test.ts` + a Stripe-webhook CSRF case) pass.
- `next build --webpack --experimental-build-mode=compile` compiles every route.
- The real `/api/webhook/stripe` handler was run once against signed test payloads: correct signature → 200, wrong /
  missing / tampered → 400. (Not kept as a suite: `lib/errors.ts` uses TypeScript parameter properties, which Node's
  strip-only test runner can't load.)
- **Not verified against a database, a real Stripe account or in a browser** — this environment has no `.env`. Worth checking:
  book a seeded service with card `4242 4242 4242 4242` while `stripe listen` forwards to `/api/webhook/stripe`; the booking
  should move to *Waiting for the provider* and appear in the provider's bookings; cancel on Stripe's page → *Try paying again*;
  a cash booking skips Stripe. On `/admin/users`, **Make admin** on a customer → they can open `/admin` on their next request.
