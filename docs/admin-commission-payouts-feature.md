# Admin commission & payouts — AD-06, AD-07 (payouts)

Admins set what Livo keeps from each booking (AD-06, BR-01) and decide provider withdrawal requests
(AD-07, PR-12) against the provider's wallet ledger (PR-11). Same pattern as the other admin areas.
The payments half of AD-07 is in [admin-payments-feature.md](admin-payments-feature.md).

## Pages

| Route | What it does |
|---|---|
| `/admin/settings/commission` | **Platform rate** form (with a live "on a 1,000 EGP booking: Livo X, provider Y" preview); **Category rates** table — every category (sub-categories indented) with its effective rate and where it comes from (own rate / from parent / platform rate), **Set rate / Change** (dialog) and **Remove**; **Recent changes** (last 15, from the audit log: who, when, from → to). First snapshot rendered on the server. |
| `/admin/payouts` | Totals: waiting for a decision, approved-to-send (both click through to the filtered list), paid out, rejected. Table: provider (+ phone, request date), amount, destination (bank / wallet + masked ref), **wallet** (available, balance, reserved by other approved payouts — red when short), status (+ who / when, rejection reason), actions. Filters in the URL: status (with counts), search (provider name, phone, account ref, exact id). Open queues (Requested / Approved) list oldest first. |

## Commission (AD-06)

### Which rate applies — `src/utils/commission.ts` (pure, 5 tests)

1. the category's own active rate, else
2. its parent's active rate (a sub-category inherits), else
3. the platform-wide rate (`CommissionSetting` with `categoryId = null`; 10% if the row is missing).

Rates are 0–50% with at most 2 decimals (`commissionRateSchema`; a blank field is an error, never 0%).

### Changes never rewrite history (BR-01)

Each booking freezes `commissionRate`, `commissionAmount` and `providerNet` when it is confirmed. A new
rate only affects bookings confirmed afterwards; past bookings, earnings and payouts are untouched. The
page says so above the forms.

> **Follow-up:** no code creates bookings yet. When the booking flow is built it must call
> `resolveCommissionRate()` (and `splitAmount()`) with the booking's category, so the rate shown here is
> the rate charged.

### Writes (each one transaction, audited)

| Change | Audit action | Metadata |
|---|---|---|
| Platform rate | `commission.update_global` | `from`, `to` |
| Set a category rate (create or change) | `commission.set_category` | `categoryId`, `categoryName`, `from` (null if it had none), `to` |
| Remove a category rate | `commission.clear_category` | `categoryId`, `categoryName`, `from`, `to: null` |

Saving the same value is a no-op (no audit row). Unknown category → 404. Commission isn't on public pages,
so nothing revalidates the storefront.

## Payouts (AD-07, PR-11, PR-12)

### Wallet model

- The ledger (`WalletTransaction`) is append-only; **balance = SUM(amount)** per provider (earnings +,
  cash-job commission −, claw-backs −, payouts −, adjustments ±). It can be negative.
- An **APPROVED** payout **reserves** its amount until it is paid, so two approvals can't spend the same
  money. Other **REQUESTED** payouts don't reserve anything.
- **available = balance − other APPROVED payouts** of the same provider.

### Rules — `src/utils/payout-rules.ts` (pure, 4 tests)

```
REQUESTED ──approve──▶ APPROVED ──mark paid──▶ PAID   (writes the PAYOUT ledger row, −amount)
    └──────reject─────────┴──────reject──────▶ REJECTED
```

| Action | Needs | Balance check |
|---|---|---|
| Approve | `REQUESTED` | amount ≤ available |
| Mark paid | `APPROVED` | amount ≤ available (re-checked: a claw-back may have landed since approval) |
| Reject (with reason, ≥ 10 chars) | `REQUESTED` or `APPROVED` | none |

The list computes the same rule and disables the button with the reason as a tooltip; the server refuses
with **409** and the same sentence.

### What one decision writes — `PATCH /api/admin/payouts/[id]/status` (one transaction)

1. A row lock on the provider (`SELECT … FOR UPDATE` on `ProviderProfile`), so concurrent decisions for
   the same provider run one after the other and the balance check can't be raced.
2. The rule check against the fresh wallet → 409 if blocked.
3. A conditional `status IN from → to` UPDATE with `processedById` / `processedAt` (and `rejectionReason`)
   — a second admin gets 409 "status just changed".
4. **Mark paid only:** the `PAYOUT` ledger row (`−amount`, note `Payout sent — ref <reference>`).
5. Audit `payout.approve` / `payout.reject` / `payout.mark_paid` (`from`, `amount`, `balanceBefore`,
   `reason` / `reference`); a `PAYOUT_UPDATE` notification to the provider.

Providers create the `REQUESTED` rows themselves at `/provider/payouts` (one waiting request at a time, minimum 100 EGP,
under the same lock) — [provider-earnings-payouts-feature.md](provider-earnings-payouts-feature.md).

> **No transfer is made by Livo.** The admin sends the money (bank / Vodafone Cash / InstaPay) and records it
> with "Mark paid" and an optional transfer reference. `processedById/At` hold the latest decision; the
> audit log keeps every step.

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/commission` | — | `AdminCommissionSettings` |
| PATCH | `/api/admin/commission` | `{ ratePercent }` | `{ ratePercent }` |
| PUT | `/api/admin/commission/categories/[id]` (`id` = category id) | `{ ratePercent }` | `{ categoryId, ratePercent }` |
| DELETE | `/api/admin/commission/categories/[id]` | — | `{ categoryId }` |
| GET | `/api/admin/payouts?status&q&page&perPage` | — | `AdminPayoutList` (`Paginated` + `counts` + `amounts` per status) |
| PATCH | `/api/admin/payouts/[id]/status` | `{ status: "APPROVED" }` · `{ status: "REJECTED", reason }` · `{ status: "PAID", reference? }` | `{ id, status }` |

All call `requireAdmin()` and are 404-gated by the proxy. Errors: 404 unknown id, 409 rule / race, 422 validation.

## Files

| Layer | File |
|---|---|
| Schemas | `commissionRateSchema`, `commissionRateBodySchema`, `payoutListQuerySchema`, `payoutStatusSchema`, `markPaidFormSchema` in `src/schemas/admin.schema.ts` |
| DTOs | `AdminCommission*`, `AdminPayout*`, `PayoutStatusDto` in `src/types/admin.ts` |
| Repositories | `commission.repository.ts`, `payout.repository.ts` |
| Services | `commission.service.ts`, `payout.service.ts` |
| Routes | `api/admin/commission/route.ts`, `api/admin/commission/categories/[id]/route.ts`, `api/admin/payouts/route.ts`, `api/admin/payouts/[id]/status/route.ts` |
| Utils + tests | `utils/commission.ts`, `utils/payout-rules.ts`; `tests/utils/commission.test.ts`, `payout-rules.test.ts`, `commission-schema.test.ts` |
| Hook | `src/hooks/use-admin-money.ts` |
| Constants | `PAYOUT_STATUS` in `constants/status.ts`; audit labels; `API_ROUTES.admin.{payouts,payoutStatus,commission,commissionCategory}`; `adminKeys.{payouts,payoutList,commission}` |
| UI | `components/admin/commission/` (`CommissionSettings`, `CategoryRateDialog`, `RateInput`), `components/admin/payouts/` (`PayoutsTable`, `MarkPaidDialog`) |
| Pages | `(admin)/admin/settings/commission/page.tsx`, `(admin)/admin/payouts/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- Booking creation must use `resolveCommissionRate()` (see above).
- A payout detail page with the provider's full ledger; manual `ADJUSTMENT` entries from the admin.
- Minimum payout amount / payout schedule (not in the SRS yet).
- Destination refs are shown as stored (masked in the seed); encrypting them at rest is a separate task.
