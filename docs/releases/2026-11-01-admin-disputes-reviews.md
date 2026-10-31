# 2026-11-01 — Admin disputes & reviews

Details: [admin-disputes-reviews-feature.md](../admin-disputes-reviews-feature.md).

- `/admin/disputes`: status tabs with counts, search, money held per dispute.
- `/admin/disputes/[id]`: complaint + evidence (admin-only signed links), booking, money, read-only chat,
  history, **Start review**, and the **decision form**: release to provider / partial refund / full refund /
  no action, offered according to the booking's money, with a live preview of what the customer gets back,
  the provider's total, the wallet change and Livo's commission, and a confirm step.
- Resolving writes, in one transaction: dispute, payments, one provider wallet ledger row, the booking's
  final status (Closed, or Cancelled on a full refund), the provider's completed-jobs count, audit and both
  parties' notifications. Money rule: `utils/dispute-settlement.ts` (pure, tested), used by the form and the server.
- `/admin/reviews`: both directions, filters (visibility, rating, direction, search), **Hide** with reason /
  **Show again**; hiding recomputes the provider's rating and the BR-04 under-review flag.
- `GET /api/admin/files/[id]` now also serves dispute evidence and chat attachments.
- The booking page's chat moved into a shared `ChatTranscript`; the dashboard's start-review hook moved to
  `use-admin-moderation.ts`.

No schema change and no migration. **No payment gateway yet:** refunds are recorded on the payment and in
the ledger; sending them to the gateway is a follow-up.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (63/63; 8 settlement + 3 rating tests new) pass.
- Against the seeded dev DB: the 3 disputes list with correct counts, held money, evidence and allowed
  decisions (held → release / partial / full; cash → no action only).
- The real write path was run **inside forced rollbacks** (nothing kept): on LV-2026-000012 (18,000 EGP
  held, 10%), partial refund 3,000 → payment partly refunded, provider +13,500, booking Closed; full refund
  → payment refunded, no wallet row, booking Cancelled; release → provider +16,200. Each wrote 1 audit row and
  2 notifications. Showing a hidden review recomputed the provider's rating. Afterwards the dispute was
  still Under review and the rating unchanged.
- Refusals: resolving a resolved dispute → 409; a refund on a cash dispute → 422; hiding a hidden review → 409.
- Browser: every new `/api/admin/*` endpoint answers the 404 envelope when signed out.
- **Not verified in a browser:** the admin screens themselves (needs an admin sign-in).
