# 2026-11-01 — Admin requests & bookings

Details: [admin-requests-bookings-feature.md](../admin-requests-bookings-feature.md).

- `/admin/requests`: status tabs with counts, category filter (incl. sub-categories), search.
- `/admin/requests/[id]` (new route, added to SITEMAP §5): request details, every quote with its status and
  booking link, history, **Close request** (DRAFT/OPEN only; waiting quotes expire; customer + quoting
  providers notified with the reason).
- `/admin/bookings`: status filter with counts, type filter, search; amount, commission, payment method and escrow.
- `/admin/bookings/[id]`: money snapshot, payments + escrow, milestones, timeline (incl. upcoming
  auto-release), read-only chat with blocked-contact flags, reviews, dispute link, history, **Cancel booking**
  — only before work starts and while no money is captured; anything paid goes through a dispute.
- New: `utils/booking-admin.ts` (cancel rule, timeline, address snapshot) with tests; `MetaBadge`;
  request / quote / payment / escrow labels in `constants/status.ts`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (52/52; 6 new booking-rule tests) pass.
- Services run against the seeded dev DB: 9 requests with per-status counts and quote counts; category
  filter includes sub-categories; request detail shows quotes and the linked booking; 15 bookings with
  per-status counts; detail for 5 representative bookings (unpaid, paid/held, cash confirmed, milestones,
  disputed) shows the right payments, chat, blocked-contact flag, timeline and cancel eligibility.
  Refusals checked without writing: cancel a paid booking → 409, in-progress → 409, accepted request → 409,
  unknown booking → 404.
- Browser: all six new `/api/admin/*` endpoints answer the 404 envelope when signed out.
- **Not verified in a browser:** the admin screens and successful cancels (needs an admin sign-in; a cancel
  would change dev data).
