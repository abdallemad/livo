# Customer request details — compare and accept quotes (CU-04, CU-05, CU-08, CU-11)

`/account/requests/[id]`: one of the customer's quote requests, the quotes providers sent, and accepting one — which
creates the booking. Same layering as the rest of the customer zone: server snapshot → client island → hook →
`/api/me/requests/[id]*` → service → repository. Every read and write is scoped to the customer id **from the session**;
someone else's request is a 404.

## Page

| Section | What it shows |
|---|---|
| Header | Title, category, posted date, the state in the customer's words (`customerRequestState`: *Quotes received*, *Open*, *Booked*…). |
| Banner | **Booked** — booking number + status + *Open the booking*; or **Waiting for quotes** with how long the request stays open (BR-05). |
| Quotes (CU-04) | Waiting quotes first, then the rest (accepted / not chosen / withdrawn / expired). Each: provider (avatar, name → public profile, rating + review count), **price** (badge on the lowest when there's more than one), duration, jobs done, years of experience, valid-until, the provider's message — **contact details masked** (`maskContactDetails`, SY-04) — and **Accept this quote** or the reason it can't be accepted. Sort: **Lowest price** (default), **Best rated**, **Newest**. |
| Progress (CU-08) | The shared `BookingTimeline`: Open → Accepted → Payment held → In progress → Completed → Reviewed, with dates; Cancelled / Disputed / Expired as exceptions (`requestTimelineState`). |
| Your request | Description, place (full saved address, or area + city), budget, wanted-on date, photos (owner-only signed previews via `/api/me/files/[id]`), **Cancel request** while draft / open (CU-11, existing endpoint). |

## Accepting a quote (CU-05)

The dialog restates the price and asks how to pay: **online** (Stripe Checkout, only when Stripe is configured) or
**cash after the job**. `POST /api/me/requests/[id]/booking { quoteId, paymentMethod }`, one transaction:

1. Re-read the request scoped to the customer; `quoteAcceptBlockedReason` (pure, tested) — request still `OPEN`, quote
   still `PENDING` and not past `validUntil`, provider `APPROVED` with an `ACTIVE` account → otherwise **409** with the sentence.
2. Conditional `request OPEN → ACCEPTED` and `quote PENDING → ACCEPTED` (409 "just changed" on a race); every other
   waiting quote → `REJECTED` ("not chosen").
3. A **`QUOTE` booking**: amount = the quote's price, commission rate resolved like service bookings
   (category → parent → global) and frozen with commission and provider net (BR-01), number `LV-<year>-NNNNNN` (retried on
   a clash), address snapshot from the request (saved address, or just area + city), **no appointment** —
   the date is agreed with the provider after acceptance (the page shows "To be agreed").
   Status `PENDING_PAYMENT` + an `ONLINE` payment, or `PENDING_PROVIDER` + a `CASH` payment.
4. Audit `request.accept_quote`; notifications: the chosen provider (`QUOTE_ACCEPTED` — "the customer is paying online"
   or "accept booking LV-… in your bookings"), every other provider who quoted (`SYSTEM` — "the customer chose another quote").

Then, for online, a Checkout session opens (same code as service bookings — [booking-checkout-feature.md](booking-checkout-feature.md)).
Stripe returns to **`/account/bookings/[id]?checkout=success|cancelled`**; that page polls the confirmation endpoint (which
reconciles with Stripe) until the webhook marks it paid. If the payment page can't open, the quote stays accepted and the
customer pays from the booking (**Pay now**), with a toast saying so.

**Cancelling a quote booking** (before the provider accepts, [customer-booking-detail-feature.md](customer-booking-detail-feature.md))
also closes its request (`ACCEPTED → CANCELLED`): the other quotes were already declined.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/me/requests/[id]` | `CustomerRequestDetail` (`private, no-store`; 404 if not yours) |
| POST | `/api/me/requests/[id]/booking` | `{ quoteId, paymentMethod: "ONLINE"\|"CASH" }` → 201 `AcceptedQuoteDto` (`bookingId`, `number`, `status`, `checkoutUrl`, `paymentError`) |
| PATCH | `/api/me/requests/[id]/status` | cancel (existing — [customer-dashboard-requests-feature.md](customer-dashboard-requests-feature.md)) |

All call `requireUser()`. Not public: no storefront revalidation.

## Files

| Layer | File |
|---|---|
| Util + tests | `quoteAcceptBlockedReason`, `sortQuotes`, `QUOTE_SORTS`, `requestTimelineState` in `src/utils/customer-request.ts`; `tests/utils/customer-request-detail.test.ts` |
| Schema | `acceptQuoteSchema` in `src/schemas/customer.schema.ts` |
| DTOs | `CustomerRequestDetail`, `CustomerQuoteDto`, `AcceptedQuoteDto` in `src/types/customer.ts` |
| Repository | `src/repositories/customer-request.repository.ts` |
| Service | `src/services/customer-request.service.ts`; shared with service bookings: `commissionFor`, `allocateBookingNumber`, `openCheckoutSession` (now exported from `booking-checkout.service.ts`, whose success URL for a booking without a service is the booking page) |
| Routes | `src/app/api/me/requests/[id]/route.ts`, `…/[id]/booking/route.ts` |
| Hook | `useMyRequest`, `useAcceptQuote` in `src/hooks/use-customer.ts` (key `customerKeys.request`) |
| Constants | `API_ROUTES.customer.request / requestBooking`; audit label `request.accept_quote` |
| UI | `src/components/customer/requests/MyRequestDetail.tsx` (quote cards, accept dialog, sort) |
| Page | `src/app/(app)/account/requests/[id]/page.tsx`; `/account/bookings/[id]` now takes `?checkout=` |

No schema change and no migration.

## Not done / follow-ups

- Milestone payments for big projects (CU-17, open decision #4) — a quote booking is paid in one go.
- Agreeing the appointment date in the app (today: by phone / chat after the provider accepts).
- Re-opening a request after its booking is cancelled (today it closes; the customer posts a new one).
- Asking a provider a question about their quote before accepting (chat opens only after booking — CU-06).
- A "seen" marker for new quotes.
