# Admin requests & bookings — AD-04

Admins see every quote request (with its quotes) and every booking (with money, payments, escrow and the
chat), and can step in when something breaks the rules. Same pattern as the other admin areas: lists are
client islands with filters in the URL, detail pages get their first snapshot from the server, actions go
through `/api/admin/*` and refetch.

## Pages

| Route | What it does |
|---|---|
| `/admin/requests` | Status tabs with counts (All, Open, Booked, Drafts, Expired, Cancelled), category filter (a parent includes its sub-categories), search (title / customer / exact id). Columns: request + customer, category, area, budget, quotes (total + waiting), posted / expiry, status. An OPEN request with quotes reads **Quotes received** (SRS 2.3). |
| `/admin/requests/[id]` | Request details (customer, budget, preferred date, expiry, address, photo count, description), every quote (provider, price, days, message, status, link to its booking), the booking, history, **Close request**. Added to SITEMAP §5 — the list alone can't show quotes. |
| `/admin/bookings` | Status filter (with counts), type filter (fixed price / from quote), search (number, customer, provider, service or request title). Columns: number + title + type, customer → provider, amount + commission, payment method + escrow, scheduled, status. |
| `/admin/bookings/[id]` | Parties, schedule, address snapshot, contact-unlock state (BR-02), customer notes, link to the source request; **money** snapshot (amount, commission %, provider net — BR-01); **payments** (method, status, escrow state, refunds, gateway ref, paid / released dates) and **milestones** (CU-17); **timeline** from the booking's timestamps incl. the upcoming auto-release (BR-08); the **chat**, read-only, with blocked contact attempts flagged (SY-04); reviews (incl. hidden); dispute banner + link; history; **Cancel booking**. |

## Actions and their rules

### Close a request — `PATCH /api/admin/requests/[id]/status` `{ status: "CANCELLED", reason }`

- Only `DRAFT` or `OPEN` (one conditional UPDATE). `ACCEPTED` → 409 "already has a booking — cancel the
  booking instead"; already closed → 409.
- Its `PENDING` quotes become `EXPIRED` (they can never be accepted).
- Audit `request.cancel` (`metadata: { from, reason }`); `SYSTEM` notification to the customer (with the
  reason) and to every provider whose quote was waiting. One transaction.

### Cancel a booking — `PATCH /api/admin/bookings/[id]/status` `{ status: "CANCELLED", reason }`

Rule (pure, tested — `utils/booking-admin.ts` `adminCancelBlockedReason`):

| Booking | Allowed? |
|---|---|
| `PENDING_PAYMENT`, `PENDING_PROVIDER`, `CONFIRMED` **and no money captured** | yes |
| any payment `PAID` / `PARTIALLY_REFUNDED`, or escrow `HELD` / `RELEASED` | no — "a refund must go through a dispute" |
| `IN_PROGRESS`, `AWAITING_CONFIRMATION`, `COMPLETED`, `CLOSED` | no — "use a dispute" |
| `DISPUTED` | no — resolve on the dispute page |
| `CANCELLED`, `REJECTED` | no — already closed |

Admin cancellation **never moves money**: refunds are a dispute decision (AD-05, BR-06/BR-08 cancellation
policy is still open). On cancel: status → `CANCELLED` with `cancelledById`, `cancelReason`, `cancelledAt`
(conditional UPDATE, 409 if the status just changed); `PENDING` payments → `FAILED` so a checkout can't
complete afterwards; audit `booking.cancel`; `BOOKING_STATUS_CHANGED` notification to both sides with the
reason. The button is disabled with a tooltip giving the reason when the rule blocks it.

Neither action changes public pages, so neither route revalidates the storefront.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/admin/requests?status&categoryId&q&page&perPage` | `AdminRequestList` (`Paginated` + counts per status) |
| GET | `/api/admin/requests/[id]` | `AdminRequestDetail` |
| PATCH | `/api/admin/requests/[id]/status` | `{ id, status }` |
| GET | `/api/admin/bookings?status&source&q&page&perPage` | `AdminBookingList` (`Paginated` + counts per status) |
| GET | `/api/admin/bookings/[id]` | `AdminBookingDetail` |
| PATCH | `/api/admin/bookings/[id]/status` | `{ id, status }` |

All call `requireAdmin()` and are 404-gated by the proxy.

## Files

| Layer | File |
|---|---|
| Schemas | `requestListQuerySchema`, `bookingListQuerySchema`, `adminCancelStatusSchema` in `src/schemas/admin.schema.ts` |
| DTOs | `src/types/admin.ts` (`AdminRequest*`, `AdminQuoteDto`, `AdminBooking*`, `AdminPaymentDto`) |
| Repositories | `request.repository.ts`, `booking.repository.ts` |
| Services | `admin-request.service.ts`, `admin-booking.service.ts` |
| Utils + tests | `src/utils/booking-admin.ts` (cancel rule, timeline events, address snapshot), `tests/utils/booking-admin.test.ts` |
| Hook | `src/hooks/use-admin-orders.ts` |
| Constants | `REQUEST_STATUS`, `QUOTE_STATUS`, `PAYMENT_STATUS`, `ESCROW_LABEL`, `PAYMENT_METHOD_LABEL` in `constants/status.ts`; audit labels in `audit-actions.ts` |
| UI | `src/components/admin/orders/` (`RequestsTable`, `RequestDetail`, `BookingsTable`, `BookingDetail`); `MetaBadge` in `components/shared/status-badge.tsx` |
| Pages | `(admin)/admin/requests/{page,[id]/page}.tsx`, `(admin)/admin/bookings/{page,[id]/page}.tsx` |

## Not done / follow-ups

- Refunds, releasing escrow and resolving disputes (AD-05 / AD-07) — the booking page links to the dispute.
- Admin can't edit a booking (reschedule, change amount) or reassign a provider.
- No CSV export or date-range filter yet.
