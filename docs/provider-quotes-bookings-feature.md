# Provider quotes & bookings — PR-07, PR-08

The provider's two work lists: the quotes they sent, and the bookings they have to accept, carry out
and finish. Mobile-first cards with large targets and plain language (NF-06), one primary action per
booking (DESIGN-SYSTEM §2). Same layering as the rest of the app: page → client island → hook →
`/api/provider/*` → service → repository. Every read and write is scoped to the provider id **from the
session**; another provider's quote or booking simply isn't found (404).

## Pages

| Route | What it does |
|---|---|
| `/provider/quotes` | Status tabs with counts — All, Waiting, Accepted, Not chosen, Withdrawn, Expired — and search by request title. Each card: status, category, request title (→ `/provider/requests/[id]`), area, **your price**, duration, the customer's budget, how many quotes the request has (never other providers' prices), your message, sent / valid-until dates. An accepted quote shows its **booking** (number, status, "Open the booking"). A waiting quote on an open request can be **withdrawn** (confirm dialog). |
| `/provider/bookings` | Tabs **Current** (to accept, confirmed, in progress, awaiting customer, disputed — soonest first), **Finished** (completed, closed), **Cancelled** (cancelled, declined) with counts; search by booking number or job title; a banner when bookings are waiting to be accepted and you're on another tab. Each card: status, fixed-price / from your quote, number, title, **day and time (Cairo)**, customer first name + place, **what you get** of the total and how you get paid, the objection deadline while awaiting the customer, and the valid **action buttons**. |
| `/provider/bookings/[id]` | Back link, title, status. Dispute / declined / cancelled banners. A **next step** card (one sentence + the actions). **When and where** (appointment in Cairo time; area only, or the full address once accepted; your quote if any). **Customer** (first name until accepted; then full name, tap-to-call phone, notes, "Message the customer"). **Money** (customer pays, Livo commission at the booking's frozen rate, **you get**, payment state; for cash jobs, how the commission is settled). **Timeline** of every timestamp incl. the upcoming auto-release. First snapshot rendered on the server; 404 for someone else's booking. |

## Booking actions — `src/utils/provider-booking.ts` (pure, tested)

```
PENDING_PROVIDER ──accept──▶ CONFIRMED ──start──▶ IN_PROGRESS ──mark done──▶ AWAITING_CONFIRMATION
       └──decline (reason)──▶ REJECTED
```

| Action | `PATCH …/status` body | From | Also writes |
|---|---|---|---|
| Accept | `{ status: "CONFIRMED" }` | `PENDING_PROVIDER` | `contactUnlockedAt` — the customer's name, phone and address unlock (BR-02) |
| Decline | `{ status: "REJECTED", reason }` (10–500 chars, the customer sees it) | `PENDING_PROVIDER` | `cancelledById/At`, `cancelReason`; payments: unpaid checkout → `FAILED`, captured money still `HELD` → `REFUNDED` in full (nothing was ever credited to the provider, so the wallet is untouched) |
| Start | `{ status: "IN_PROGRESS" }` | `CONFIRMED` | `startedAt` |
| Mark done | `{ status: "AWAITING_CONFIRMATION" }` | `IN_PROGRESS` | `providerCompletedAt`, `autoReleaseAt = now + SiteSetting["booking.objectionWindowHours"]` (BR-08; 48 h default, capped at 30 days) |

- Only an **APPROVED** provider may **accept** (the button is disabled with the reason). Work already accepted
  can still be started, finished or declined.
- Each action is **one transaction**: re-read the booking scoped to the provider, check the rule (409 with the
  rule's sentence), conditional `status = from → to` UPDATE (409 "just changed" if someone else moved it), the
  payment changes for a decline, an **audit** row (`booking.provider_accept` / `provider_decline` / `start` /
  `provider_done`, with `from`, `to`, `reason`, `refunded`) and a **notification** to the customer
  (`BOOKING_CONFIRMED` on accept, otherwise `BOOKING_STATUS_CHANGED`; mark-done says the deadline in Cairo time).
- **Not offered:** cancelling after accepting — that's the BR-06 cancellation policy, still undecided. After
  "mark done" the customer confirms (CU-09) or the window ends; neither is built yet.
- `PENDING_PAYMENT` bookings are **invisible to providers**: the customer hasn't paid, so it isn't a booking for them yet.

> **No payment gateway yet:** a decline's refund is recorded on the payment row; sending it to the gateway
> (and confirming by webhook) is a follow-up, as for dispute refunds.

## Quote withdrawal — `src/utils/provider-quote.ts` (pure, tested)

`PATCH /api/provider/quotes/[id]/status { status: "WITHDRAWN" }` — only a `PENDING` quote on an `OPEN`
request; a conditional update, so a quote the customer accepted a moment ago can't be withdrawn (409).
Not audited (no money moves). Note: `Quote` is unique per (request, provider), so sending a *new* quote on the
same request after withdrawing needs the future `/provider/requests/[id]` page to reuse the row.

## Privacy (BR-02, SY-04, business analysis R1)

Until the provider accepts: customer **first name** and **area** only; no phone, no street address; the
customer's **notes** pass through `src/utils/contact-mask.ts` (pure, tested), which hides phone numbers
(Western and Arabic-Indic digits, `+20`/`00`, spaced or dashed), emails and WhatsApp/Telegram links — prices,
sizes and dates stay. The place helper `bookingPlace()` is shared with the provider home page.

## Times

All appointment times, deadlines and timeline entries use `formatZonedTime/Day/DateTime` from
`src/utils/zoned-time.ts` (fixed `Africa/Cairo`), so the server render (UTC) and the browser agree and match
the customer's clock.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/provider/quotes?status&q&page&perPage` | `ProviderQuoteList` (`Paginated` + `counts` per status) |
| PATCH | `/api/provider/quotes/[id]/status` | `{ id, status }` |
| GET | `/api/provider/bookings?tab&q&page&perPage` | `ProviderBookingList` (`Paginated` + tab `counts` + `toAccept`) |
| GET | `/api/provider/bookings/[id]` | `ProviderBookingDetail` |
| PATCH | `/api/provider/bookings/[id]/status` | `{ id, status }` |

All call `requireProvider()`, take the provider id from the session, answer `private, no-store` on reads.
Errors: 404 unknown / not yours, 409 rule or race, 422 validation. Not public: no storefront revalidation.

## Files

| Layer | File |
|---|---|
| Schemas | `providerQuoteListQuerySchema`, `providerQuoteStatusSchema`, `providerBookingListQuerySchema`, `providerBookingStatusSchema`, `declineFormSchema` in `src/schemas/provider.schema.ts` |
| DTOs | `ProviderQuote*`, `ProviderBooking*` in `src/types/provider.ts` |
| Repository | `src/repositories/provider-booking.repository.ts` |
| Services | `provider-quote.service.ts`, `provider-booking.service.ts` |
| Routes | `api/provider/quotes/route.ts`, `api/provider/quotes/[id]/status/route.ts`, `api/provider/bookings/route.ts`, `api/provider/bookings/[id]/route.ts`, `api/provider/bookings/[id]/status/route.ts` |
| Utils + tests | `utils/provider-booking.ts`, `utils/provider-quote.ts`, `utils/contact-mask.ts`, Cairo formatters in `utils/zoned-time.ts`; `tests/utils/provider-booking.test.ts`, `provider-quote.test.ts`, `contact-mask.test.ts`, `zoned-time.test.ts` |
| Hooks | `src/hooks/use-provider-workspace.ts` (every write invalidates `providerKeys.all`, so home counters refresh too) |
| Constants | `API_ROUTES.provider.{quotes,quoteStatus,bookings,booking,bookingStatus}`, `providerKeys.{quotes,quoteList,bookings,bookingList,booking}`, audit labels |
| UI | `components/provider/quotes/QuotesList.tsx`, `components/provider/bookings/{BookingsList,BookingDetail,BookingActions}.tsx` (decline reuses `admin/shared/ReasonDialog`) |
| Pages | `(provider)/provider/quotes/page.tsx`, `(provider)/provider/bookings/page.tsx`, `(provider)/provider/bookings/[id]/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- `/provider/requests/[id]` — sending or editing a quote (PR-07); the quote cards link there.
- Customer side: confirm completion (CU-09), auto-release job when `autoReleaseAt` passes (BR-08), cancellation
  policy (BR-06, CU-11).
- Recording cash collection on a cash job (the payment row stays `PENDING` until something marks it paid).
- Chat (`/provider/messages/[bookingId]`, PR-09) — the detail page links to it once contact is unlocked.
- Gateway refunds for declined online bookings.
