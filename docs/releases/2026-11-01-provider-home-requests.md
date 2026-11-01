# 2026-11-01 — Provider home and available requests

Details: [provider-dashboard-requests-feature.md](../provider-dashboard-requests-feature.md).

## `/provider` (PR-14, PR-03)

- Replaced the static zeros with real data: account status with the rejection reason, low-rating review
  warning (BR-04), new requests, quotes waiting, bookings to accept, earnings this month, wallet balance,
  rating and jobs done.
- Setup checklist (specialties, areas, a fixed-price service) until they're done.
- The 5 newest matching requests and today's bookings (Cairo time; area and first name only until contact is
  unlocked, BR-02).
- New endpoint `GET /api/provider/dashboard`.

## `/provider/requests` (PR-06, SY-01)

- Replaced the placeholder. Matching engine: approved providers only, open and unexpired requests, same city,
  their categories and sub-categories, their work areas (or the whole city on request), not already quoted.
- Tabs New for you / Quoted (with the provider's quote and its status), filters, sorting, search, paging.
- No customer identity or address in any response (BR-02, SY-04).
- New endpoint `GET /api/provider/requests`.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (92/92; 11 new: 6 matching, 5 Cairo time) pass.
- **Not verified in a browser or against a database:** this environment has no `.env` (no DB, no Clerk keys).
  Worth checking with the seed: plumber "محمود عبد الرحمن" (provider 1; plumbing, Nasr City / Heliopolis /
  New Cairo) should see request 3 (plumbing, Heliopolis) under New for you; the pending plumber (provider 6)
  should see the "under review" message instead of a list.

## Known gaps

- `/provider/requests/[id]` (send a quote, PR-07) is still a placeholder — out of this change's scope.
- The provider layout banner still says "Under review" for every provider (pre-existing TODO in the layout).
