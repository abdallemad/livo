# Admin payments — AD-07 (payments review)

Admins review every payment on the platform: what customers paid, what Livo still holds in escrow,
what reached providers, what was refunded, and cash jobs. Same pattern as the other admin lists: a client
island with filters in the URL, data from one `/api/admin/*` endpoint.

The other half of AD-07 — **payout requests** (`/admin/payouts`: approve / reject / mark paid) — is a
separate page and is **not** built yet.

## Page

| Route | What it does |
|---|---|
| `/admin/payments` | Four totals cards (over **all** payments, not the filtered view), then the payments table. Filters: status (with counts: Pending, Paid, Partly refunded, Refunded, Failed), method (Online / Cash), escrow state, search (booking number, customer or provider name, gateway ref, exact payment id). Newest first, 20 per page, real `<a>` page links. |

Table columns: booking number + title + booking status (+ milestone, CU-17) → link to `/admin/bookings/[id]`;
customer → provider (links to their admin pages); amount, refunded part, the booking's commission %;
method, escrow state (online only), gateway ref; paid / released dates (or created date if not paid);
payment status, plus a **Disputed** link when the booking has an unresolved dispute.

## Totals — `src/utils/payment-summary.ts` (pure, 5 tests)

Uses the same definitions as the dispute money rule (`utils/dispute-settlement.ts`):

| Card | Meaning |
|---|---|
| **Collected online** | Online payments that reached Livo: `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED` (gross). |
| **Held in escrow** | `PAID` / `PARTIALLY_REFUNDED` with escrow `HELD`, minus anything refunded. |
| **Released to providers** | Captured money with escrow `RELEASED` / `PARTIALLY_REFUNDED`, minus refunds. The hint shows the total **refunded** to customers. |
| **Cash jobs** | `CASH` payments marked `PAID` — never passed through Livo, so never in the online totals. The hint shows pending checkouts and failed payments. |

For online money, `collected = held + released + refunded` (tested).

## Read-only on purpose

This page never moves money. Money changes only through:
- the payment gateway webhook (the source of truth for `PAID`, CLAUDE.md §8 — not wired yet),
- the booking's auto-release after the objection window (BR-08),
- a dispute decision (AD-05, `/admin/disputes/[id]`),
- an admin booking cancellation, which only fails a **pending** checkout (AD-04).

To act on a payment, open its booking or dispute from the row.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/admin/payments?status&method&escrow&q&page&perPage` | `AdminPaymentList` (`Paginated` + `counts` per status + `summary`) |

Calls `requireAdmin()`, is 404-gated by the proxy, answers `cache-control: private, no-store`.

## Files

| Layer | File |
|---|---|
| Schema | `paymentListQuerySchema`, `ADMIN_PAYMENT_STATUSES`, `ADMIN_PAYMENT_METHODS`, `ADMIN_ESCROW_STATES` in `src/schemas/admin.schema.ts` |
| DTOs | `AdminPaymentListItem`, `AdminPaymentList` in `src/types/admin.ts` |
| Repository | `src/repositories/payment.repository.ts` (page + count in one transaction, counts by status, money `groupBy`) |
| Service | `src/services/admin-payment.service.ts` |
| Route | `src/app/api/admin/payments/route.ts` |
| Util + tests | `src/utils/payment-summary.ts`, `tests/utils/payment-summary.test.ts` |
| Hook | `src/hooks/use-admin-payments.ts` (key `adminKeys.paymentList`, under `adminKeys.all` so cancel / dispute actions refresh it) |
| Constants | `API_ROUTES.admin.payments`; reuses `PAYMENT_STATUS`, `ESCROW_LABEL`, `PAYMENT_METHOD_LABEL` from `constants/status.ts` |
| UI | `src/components/admin/payments/PaymentsTable.tsx` |
| Page | `src/app/(admin)/admin/payments/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- `/admin/payouts` (payout requests, the other half of AD-07).
- Date-range filter and CSV export.
- Gateway reconciliation (comparing our rows with the gateway's report) once a gateway is chosen.
