# Admin disputes & reviews — AD-05, AD-08

Admins settle disputes (review evidence and chat, decide where the money goes) and moderate reviews
(hide what breaks the rules). Same pattern as the other admin areas: lists are client islands with filters
in the URL, detail pages get their first snapshot from the server, actions go through `/api/admin/*`.

## Pages

| Route | What it does |
|---|---|
| `/admin/disputes` | Tabs with counts (All, Open, Under review, Resolved). Open queues are oldest first; Resolved shows the latest decision first. Search: booking number, names, reason. Columns: booking + parties, opened by (customer / provider), reason + evidence count, money held, dates, status + outcome. |
| `/admin/disputes/[id]` | Complaint + **evidence** (private files, admin-only signed links), the booking (parties, amount, commission, schedule), **money** (held, credited to the provider so far, each payment), the **chat** (read-only), history, **Start review** (OPEN), and the **decision form** with a live money preview. A resolved dispute shows its outcome, note, who decided and when. |
| `/admin/reviews` | Every review, both directions (SY-05): filters for visibility, rating, direction (customer → provider / provider → customer) and search (text, names, booking). Shows stars, comment, provider reply, booking link; **Hide** (with reason) / **Show again**. |

## Settling a dispute

`PATCH /api/admin/disputes/[id]/status`:
- `{ status: "UNDER_REVIEW" }` — OPEN → UNDER_REVIEW (also used by the dashboard).
- `{ status: "RESOLVED", resolution, refundAmount?, note }` — the decision.

### The money rule — `src/utils/dispute-settlement.ts` (pure, 8 tests)

The admin preview and the server run the **same function**, so what the admin confirms is what is written.

- Only **captured online money** moves (payments `PAID` / `PARTIALLY_REFUNDED` with escrow `HELD` /
  `RELEASED` / `PARTIALLY_REFUNDED`). Cash never passed through Livo.
- Which decisions the form offers depends on that money (`availableResolutions`):

  | Booking money | Offered |
  |---|---|
  | something still **held** | Release to provider, Partial refund, Full refund |
  | paid but already released | No action, Partial refund, Full refund |
  | nothing captured (cash) | No action |

- A dispute is **final**: every payment still held ends either released or refunded.
- Refunds come out of held money first, then released money (newest first). A partial refund must be
  above 0 and below what can still be refunded.
- **Commission is charged on what the customer finally pays.** The provider's wallet for the booking must
  end at `(captured − refunded) × (1 − commission rate)`; the difference from what was already credited is
  written as one `EARNING` (+) or `REFUND_CLAWBACK` (−) ledger row (PR-11). **No action** never writes to
  the wallet.

### What one resolution writes (one transaction)

1. Dispute → `RESOLVED` with resolution, refund amount, note, `resolvedById/At` — a conditional UPDATE, so
   it can't be settled twice (second admin → 409).
2. Payments: `refundedAmount`, `status`, `escrowState`, `releasedAt` for released money.
3. One wallet ledger row for the provider (if the amount changes).
4. A `DISPUTED` booking → `CLOSED`, or `CANCELLED` on a full refund (a booking that wasn't `DISPUTED`, e.g.
   an already-closed cash job, is left alone); the provider's `completedCount` is refreshed.
5. Audit `dispute.resolve` (`resolution`, `refundAmount`, `walletDelta`, `providerNetAfter`, the note);
   `DISPUTE_UPDATE` notifications to the customer and the provider with the outcome and the note.

Errors: unknown → 404; already resolved → 409; a decision the money doesn't allow, or a bad partial amount
→ 422 on the `resolution` / `refundAmount` field (shown in the form).

> **No payment gateway is wired yet.** A refund is recorded on the payment row and in the ledger; sending
> it to the gateway (and confirming it by webhook, CLAUDE.md §8) is a follow-up.

## Moderating reviews

`PATCH /api/admin/reviews/[id]/status` — `{ action: "HIDE", reason }` / `{ action: "SHOW" }`.

- Conditional update (already hidden / visible → 409).
- If the reviewee is a provider, their `ratingAvg` / `ratingCount` are recomputed from **visible** reviews
  only, and the BR-04 `underReview` flag is set from `SiteSetting["review.lowRatingThreshold"]`
  (`{ minBookings, maxAverage }`, default 5 / 3) — `src/utils/provider-rating.ts` (pure, 3 tests).
- Audit `review.hide` / `review.show`; `SYSTEM` notification to the reviewer (with the reason on hide).
- Calls `revalidateStorefront()` (ratings and reviews show on public pages).

## Evidence and private files

`GET /api/admin/files/[id]` now serves any private upload an admin may see: provider verification
documents, **dispute evidence** and chat attachments (`services/admin-file.service.ts`,
`repositories/file.repository.ts`). Anything else 404s.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/admin/disputes?status&q&page&perPage` | `AdminDisputeList` (`Paginated` + counts per status) |
| GET | `/api/admin/disputes/[id]` | `AdminDisputeDetail` (incl. `availableResolutions`, `walletCreditedSoFar`) |
| PATCH | `/api/admin/disputes/[id]/status` | `{ id, status }` |
| GET | `/api/admin/reviews?visibility&rating&direction&q&page&perPage` | `AdminReviewList` (`Paginated` + `hiddenCount`) |
| PATCH | `/api/admin/reviews/[id]/status` | `{ id, isHidden }` |

All call `requireAdmin()` and are 404-gated by the proxy.

## Files

| Layer | File |
|---|---|
| Schemas | `disputeStatusSchema` (now a union), `resolveDisputeFormSchema`, `disputeListQuerySchema`, `reviewListQuerySchema`, `reviewModerationSchema` in `src/schemas/admin.schema.ts` |
| DTOs | `AdminDispute*`, `AdminReview*`, `AdminMessageDto` in `src/types/admin.ts` |
| Repositories | `dispute.repository.ts` (extended), `ledger.repository.ts`, `review.repository.ts`, `file.repository.ts` |
| Services | `dispute.service.ts` (list, detail, start review, resolve), `admin-review.service.ts`, `admin-file.service.ts` |
| Utils + tests | `utils/dispute-settlement.ts` + `tests/utils/dispute-settlement.test.ts`; `utils/provider-rating.ts` + `tests/utils/provider-rating.test.ts` |
| Hook | `src/hooks/use-admin-moderation.ts` (the dashboard's "Start review" now uses it) |
| Constants | `RESOLUTION_LABEL`, `RESOLUTION_HELP` in `constants/status.ts`; audit labels |
| UI | `src/components/admin/moderation/` (`DisputesTable`, `DisputeDetail`, `ResolveDisputeForm`, `ReviewsTable`); `components/admin/shared/ChatTranscript.tsx` (also used by the booking page) |
| Pages | `(admin)/admin/disputes/{page,[id]/page}.tsx`, `(admin)/admin/reviews/page.tsx` |

## Not done / follow-ups

- Gateway refunds and webhook confirmation (see the note above).
- Admins can't add their own evidence or message the parties from the dispute page.
- Admins can't edit a review's text or the provider's reply — only hide / show.
