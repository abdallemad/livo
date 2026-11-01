# 2026-11-01 — Provider schedule and reviews; icon-only sidebar everywhere

Details: [provider-schedule-reviews-feature.md](../provider-schedule-reviews-feature.md).

## `/provider/schedule` (PR-10)

- Replaced the placeholder: weekly working hours Saturday → Friday with up to 3 ranges a day in half-hour steps,
  a "Sat–Thu, 9 to 6" preset, inline validation, Save / Undo; and the next 14 days of bookings against those hours,
  flagging any booking outside them. New `GET|PUT /api/provider/schedule`.

## `/provider/reviews` (PR-13)

- Replaced the placeholder: rating summary and star distribution (visible reviews only), BR-04 warning, tabs
  All / Needs a reply / Replied, rating filter, and a public reply per review (add / edit / remove). Replies with
  phone numbers, emails or chat links are refused. New `GET /api/provider/reviews`,
  `PUT|DELETE /api/provider/reviews/[id]/reply`.

## Sidebar

- The header button now collapses the **customer and provider** sidebars to icons with tooltips (like admin)
  instead of hiding them; a rail on the sidebar edge does the same. Collapsed touch-size icons shrink to fit.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (119/119; 8 new) pass.
- Found and fixed while checking the design rules: the star-distribution bars first used the amber `commit`
  colour, which DESIGN-SYSTEM reserves for commit buttons and the stars themselves; they're primary now.
- **Not verified in a browser or against a database:** this environment has no `.env` (no DB, no Clerk keys), so
  the collapsed sidebar wasn't seen either. Worth checking: collapse the provider sidebar on desktop (icons +
  tooltips, active item highlighted), and with the seed, a provider's schedule shows Sat–Thu 9–6 and Friday off.
