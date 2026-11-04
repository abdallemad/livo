# Customer booking details — CU-09, CU-11, CU-12, BR-02, BR-06, BR-08

`/account/bookings/[id]`: one of the customer's bookings, with everything they can do to it. Same layering as the
provider's booking page ([provider-quotes-bookings-feature.md](provider-quotes-bookings-feature.md)): server snapshot
→ client island → hook → `/api/me/bookings/[id]*` → service → repository. Every read and write is scoped to the customer
id **from the session**; someone else's booking is a 404.

## Page

| Section | What it shows |
|---|---|
| Header | Title, booking number, fixed-price / from a quote, status badge, back to My bookings. |
| Progress | Booked → Paid (online only) → Accepted → Work started → Marked done → Confirmed (`bookingStages`). Hidden for cancelled / declined / disputed bookings, which get a banner instead. |
| Banners | Dispute (open or settled) with its reason; closed booking — *you cancelled* / *the provider couldn't take it* / *Livo cancelled it* — with the reason and the refund. |
| Next step | `customerNextStep()` (shared with the list) and the actions valid now: **Pay now** (Stripe Checkout), **Confirm the job is done**, **Cancel booking**, **Leave a review**, **Report a problem**. |
| When and where | Appointment (Cairo time), the address snapshot, the customer's own notes. |
| Provider | Avatar + name → public profile. Phone (tap to call) and **Message the provider** only while a confirmed booking is live (BR-02, `contactVisible`). |
| Payment | Total, what Livo **holds** (and when it auto-releases), what was **refunded**; every payment row when there's more than one. Abandoned checkout attempts are hidden. |
| History | Every timestamp (`bookingEvents`, same as the provider and admin pages), incl. the upcoming auto-release. |

## Actions — `src/utils/customer-booking-actions.ts` (pure, tested)

```
PENDING_PAYMENT ─┐
PENDING_PROVIDER ┴─cancel──▶ CANCELLED           before the provider accepts: free, full refund
AWAITING_CONFIRMATION ──confirm──▶ COMPLETED     CU-09: held money goes to the provider
```

| Action | `PATCH /api/me/bookings/[id]/status` | Money | Notified |
|---|---|---|---|
| Confirm (CU-09) | `{ status: "COMPLETED" }` | Online: payments `HELD → RELEASED` (`releasedAt`), one wallet **EARNING** = `(captured − refunded) × (1 − rate)` minus what this booking already credited. Cash: the cash payment → `PAID` (the customer confirms they paid) and Livo's commission → wallet **COMMISSION_DEBT** (−). Same model as the seed and dispute settlement. Provider's completed-jobs counter refreshed. | Provider (`BOOKING_STATUS_CHANGED`, with the wallet amount) |
| Cancel (CU-11) | `{ status: "CANCELLED", reason? }` (≤ 500, the provider sees it) | Unpaid / uncollected payments → `FAILED`; captured online money still `HELD` → `REFUNDED` in full. | Provider, only if the booking had reached them (`PENDING_PROVIDER`) |

- One transaction each: re-read the booking scoped to the customer, check the rule (409 with the sentence), conditional
  `status IN (from) → to` UPDATE (409 "just changed"), money rows, audit (`booking.customer_confirm` /
  `booking.customer_cancel` with `from`, `to`, `reason`, `refunded` / `released`, `walletNet`), notification.
- **Open dispute** → no actions (409); the dispute decides the money.
- **Cancelling after the provider accepted is not offered.** BR-06 says the cancellation policy depends on the time left
  before the appointment and is still to be decided. The customer can report a problem or contact support; admins can
  still cancel an unpaid booking ([admin-requests-bookings-feature.md](admin-requests-bookings-feature.md)).
- "Report a problem" (CU-12) is offered from acceptance until the job is confirmed, once per booking.

### Stripe on cancel

After the transaction commits (never inside it):
1. An **open Checkout session** of an unpaid booking is expired, so it can't be paid after cancelling. If the customer paid
   in that instant, the webhook's "paid after close" path flags it for a refund ([booking-checkout-feature.md](booking-checkout-feature.md)).
2. Each refunded payment is **refunded on Stripe** (`refunds.create` on the payment intent stored by the webhook,
   idempotency key per payment row, so a retry never refunds twice).
3. If that can't be sent (Stripe not configured, no payment intent, API error), the row still says `REFUNDED`, an audit
   `payment.refund_failed` is written and every admin gets a "Refund for LV-… needs a hand" notification.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/me/bookings/[id]` | `CustomerBookingDetail` (`private, no-store`; 404 if not yours) |
| PATCH | `/api/me/bookings/[id]/status` | `CustomerBookingStatusDto` `{ id, status, refunded }` |

Both call `requireUser()`. Not public: no storefront revalidation.

## Files

| Layer | File |
|---|---|
| Util + tests | `src/utils/customer-booking-actions.ts` (transitions, blocked reasons, `completionPlan`, `cancellationPlan`, `bookingStages`); `tests/utils/customer-booking-actions.test.ts` |
| Schema | `customerBookingStatusSchema` in `src/schemas/customer-account.schema.ts` |
| DTOs | `CustomerBookingDetail`, `CustomerBookingStatusDto` in `src/types/customer-account.ts` |
| Repository | `src/repositories/customer-booking.repository.ts`; wallet / payment / completed-count writes reuse `ledger.repository.ts` |
| Service | `src/services/customer-booking.service.ts`; Stripe helpers `refundOnStripe`, `expireOpenSession`, `paymentIntentOf` in `booking-checkout.service.ts` |
| Routes | `src/app/api/me/bookings/[id]/route.ts`, `…/[id]/status/route.ts` |
| Hook | `useMyBooking`, `useUpdateMyBookingStatus` in `src/hooks/use-customer-account.ts` (key `customerKeys.booking`) |
| Constants | `API_ROUTES.customer.booking / bookingStatus`; audit labels `booking.customer_confirm`, `booking.customer_cancel`, `payment.refund_failed` |
| UI | `src/components/customer/bookings/{MyBookingDetail,MyBookingActions}.tsx`; reuses `PayNowButton` |
| Page | `src/app/(app)/account/bookings/[id]/page.tsx` (`?checkout=success\|cancelled` after Stripe for quote bookings: polls until paid) |

No schema change and no migration.

## Not done / follow-ups

- **Auto-release job (BR-08):** nothing yet moves an `AWAITING_CONFIRMATION` booking to `COMPLETED` when `autoReleaseAt`
  passes. When built, it should call the same `completionPlan`.
- Cancellation after acceptance (BR-06 policy).
- The dispute page the actions link to (`/dispute`, CU-12) is still a placeholder. The review page (`/review`, CU-10) is
  built — [customer-review-feature.md](customer-review-feature.md); once rated, the next step shows **See your review**.
  Chat (`/account/messages/[id]`, CU-06) is built — [messages-feature.md](messages-feature.md).
- Refunds on provider decline and dispute decisions still aren't sent to Stripe (only recorded on the payment row;
  `refundOnStripe` is ready for them).
- PDF invoice for the booking (SY-07).
