# Provider earnings & payouts — PR-11, PR-12

The provider's money pages. SRS PR-11 asks for the wallet — *amount due, collected, commission deducted* —
and PR-12 for requesting a payout. They sit on the **same ledger and payout rules as the admin side**
([admin-commission-payouts-feature.md](admin-commission-payouts-feature.md)): an admin approves, rejects
and marks paid at `/admin/payouts`; the provider asks and follows along here. The provider id always comes
**from the session**.

## Pages

| Route | What it does |
|---|---|
| `/provider/earnings` | "This month you earned X (last month Y)", the **wallet summary** (below), and **Wallet movements**: every ledger entry newest first — date and time (Cairo), what it is (Earning / Commission on a cash job / Payout sent / Refund taken back / Adjustment by Livo, with a one-line explanation on hover), the booking it belongs to (→ booking page), the note, the amount (+ green / − red) and the **balance after** it. Type filter + 15 per page, in the URL. One amber "Request a payout" button. |
| `/provider/payouts` | The wallet summary, then either the **request form** — amount (prefilled with everything available, "All of it" button), where to send it (mobile wallet / InstaPay or bank account, prefilled from the last request) — or a sentence saying why a request isn't possible now; and **Your requests**: amount, destination (masked), requested / approved / sent / declined dates, the admin's reason when declined, status. |

## Wallet summary (`WalletSummary`, DESIGN-SYSTEM §8)

| Card | PR-11 term | Source |
|---|---|---|
| **Available to withdraw** | due | `balance − open payouts` (requested + approved, not paid yet), never below 0 — `availableToRequest` |
| **On hold** | due (not yet) | online payments still **held in escrow** for this provider's bookings, as their net: `(paid − refunded) × (1 − booking rate)` — released after the customer confirms or the objection window ends (BR-08) |
| **Received** | collected | payouts sent (`PAYOUT` rows) **+** cash the provider collected on completed cash jobs |
| **Commission deducted** | commission | `Booking.commissionAmount` of completed / closed bookings (the frozen snapshot, BR-01) — same definition as the admin dashboard's "commission earned" |

- `balance = SUM(WalletTransaction.amount)`; it can be **negative** when cash-job commission (`COMMISSION_DEBT`)
  exceeds earnings — the page then says "You owe Livo X in commission" and nothing can be withdrawn.
- "This month / last month" = `EARNING + REFUND_CLAWBACK` created in that **Cairo** month (same as the home page).
- **Balance after** each entry: the total minus everything newer. An unfiltered page needs one aggregate; with a
  type filter each row is anchored separately (rows of other types sit in between).

## Requesting a payout — `src/utils/provider-wallet.ts` (pure, 6 tests)

| Rule | Why |
|---|---|
| The provider is **APPROVED** | a suspended / unverified account can't move money |
| **One open request** (`REQUESTED`) at a time | keeps the admin queue simple; ask again once it's handled |
| **Minimum 100 EGP**, at most what's available (and ≤ 100,000) | small transfers cost more than they're worth |
| `available` subtracts **every open payout** (requested + approved) | stricter than the admin approve check (approved only), so the same money can't be requested twice |
| Destination: **wallet** = an Egyptian mobile (010/011/012/015, any format, Arabic digits ok) or `name@instapay`; **bank** = IBAN (`EG` + 27 digits) or account number (10–20 digits) | normalized on save (`normalizeDestination`) so the admin copies a clean value |

`POST /api/provider/payouts` runs in **one transaction** under the **same provider row lock** as the admin's
decisions (`SELECT … FOR UPDATE` on `ProviderProfile`): re-read balance and open payouts, apply the rule
(amount problems → 422 on the `amount` field; account / open-request problems → 409), create the `REQUESTED`
payout, audit `payout.request` (`amount`, `destinationType`, `balanceBefore`), and an in-app notification to
every active admin. Nothing is written to the ledger until an admin marks it paid.

Lists show destinations **masked** (`••••5678`, `ah•••@instapay`). The full value is stored because the admin
needs it to send money; encrypting it at rest is still a follow-up (as noted on the admin side). The form
prefills the last destination only when it's a real (unmasked) value — the seed's are placeholders.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/provider/earnings?type&page&perPage` | `ProviderEarnings` (`summary` + paginated `ledger` with `balanceAfter`) |
| GET | `/api/provider/payouts?page&perPage` | `ProviderPayouts` (`Paginated` history + `summary`, `requestBlockedReason`, `lastDestination`) |
| POST | `/api/provider/payouts` | `{ amount, destinationType, destinationRef }` → 201 `{ id }` |

All call `requireProvider()`; reads answer `private, no-store`. Not public: no storefront revalidation.
A request invalidates every provider query (the home page shows the wallet balance too).

## Files

| Layer | File |
|---|---|
| Schemas | `src/schemas/provider-wallet.schema.ts` |
| DTOs | `src/types/provider-wallet.ts` |
| Repository | `src/repositories/provider-wallet.repository.ts` |
| Service | `src/services/provider-wallet.service.ts` |
| Routes | `api/provider/earnings/route.ts`, `api/provider/payouts/route.ts` |
| Utils + tests | `src/utils/provider-wallet.ts`, `tests/utils/provider-wallet.test.ts` |
| Hook | `src/hooks/use-provider-wallet.ts` (`providerKeys.earnings/payouts`) |
| Constants | `API_ROUTES.provider.{earnings,payouts}`; audit label `payout.request` |
| UI | `components/provider/wallet/{WalletSummary,EarningsBoard,PayoutsBoard}.tsx` |
| Pages | `(provider)/provider/earnings/page.tsx`, `(provider)/provider/payouts/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- **Cancelling** a waiting request: `PayoutStatus` has no `CANCELLED`, so it needs a small enum migration.
- Encrypting `Payout.destinationRef` at rest; verifying the account holder's name.
- A statement export (PDF / CSV) of wallet movements.
